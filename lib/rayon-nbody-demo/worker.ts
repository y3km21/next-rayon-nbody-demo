import * as Comlink from "comlink";
import { ExecutionMode } from "./main";
import * as Three from "three";
import { RawShaderMaterial } from "three";
import { MutableRefObject } from "react";
import { threads } from "wasm-feature-detect";

export interface Handler {
  runRayonNbodyDemo: (
    offscreen: OffscreenCanvas,
    numBodies: number,
    mode: ExecutionMode,
    switchingRender: MutableRefObject<() => boolean>,
    statsBegin: () => void,
    statsEnd: () => void
  ) => Promise<void>;
}

interface NBodyCondition {
  color: number[];
  world_position: number[];
}

interface Point3 {
  x: number;
  y: number;
  z: number;
}

export const handler = async (parallel: boolean) => {
  const rayonNbodyDemo = parallel
    ? await import("rayon-nbody-demo")
    : await import("rayon-nbody-demo_single");
  await rayonNbodyDemo.default();

  const runRayonNbodyDemo = async (
    offscreen: OffscreenCanvas,
    numBodies: number,
    mode: ExecutionMode,
    switchingRender: MutableRefObject<() => boolean>,
    statsBegin: () => void,
    statsEnd: () => void
  ) => {
    // If threads are unsupported in this browser
    if (!(await threads()) && parallel) {
      console.error("Threads are unsupported in this browser.");
      return;
    }

    /************************************************************
     *
     * Init
     *
     ************************************************************/
    if (parallel) {
      await (
        rayonNbodyDemo as typeof import("rayon-nbody-demo")
      ).initThreadPool(navigator.hardwareConcurrency);
    }

    rayonNbodyDemo.logging_init();

    /************************************************************
     *
     * Material
     *
     ************************************************************/

    /**
     * Vertex Shader
     * https://threejs.org/docs/#api/en/renderers/webgl/WebGLProgram
     */
    const vertexShader = `
    precision highp float;

    uniform mat4 modelMatrix;
    // uniform mat4 viewMatrix;
    // uniform mat4 modelViewMatrix;
    // uniform mat4 projectionMatrix;

    uniform mat4 matrix;
    uniform vec3 world_position;
    
    attribute vec3 position;

    void main() {
        gl_Position =  matrix * modelMatrix * vec4(position * 0.1 + world_position * 0.0005, 1.0);
        // 同条件のcameraセット時
        //gl_Position = projectionMatrix * viewMatrix *  modelMatrix * vec4( position * 0.1 + world_position * 0.0005, 1.0) ;
    } 
    `;

    /**
     * Fragment Shader
     */
    const fragmentShader = `
    precision highp float;
    
    uniform vec3 color;
    
    void main() {
        gl_FragColor = vec4(color, 1.0);
    } 
    `;

    // Projection
    //
    // PerspectiveFov
    // https://docs.rs/cgmath/latest/src/cgmath/projection.rs.html#30-43
    // https://docs.rs/cgmath/latest/src/cgmath/projection.rs.html#108-175
    // Left handed
    const proj = new Three.Matrix4();
    const fovy = (Math.PI * 2) / 6;
    const aspect = 800 / 600;
    const near = 0.1;
    const far = 3000;

    const f = 1 / Math.tan(fovy / 2); // cot
    proj.set(
      // c0
      f / aspect,
      0,
      0,
      0,
      // c1
      0,
      f,
      0,
      0,
      // c2
      0,
      0,
      (far + near) / (near - far),
      -1,
      // c3
      0,
      0,
      (2 * far * near) / (near - far),
      0
    );

    proj.transpose(); // to Right handed

    // viewMatrix
    const view = new Three.Matrix4();
    const eye = new Three.Vector3(10, 10, 10);
    const target = new Three.Vector3(0, 0, 0);
    const up = new Three.Vector3(0, 0, 1); // Arbitrary alis
    view.lookAt(eye, target, up).setPosition(eye);
    view.invert(); // == matrixWorldInverse

    // projectionMatrix * viewMatrix
    const proj_view = new Three.Matrix4();
    proj_view.multiplyMatrices(proj, view);

    const createMaterial = (
      color: Three.Color,
      worldPosition: Three.Vector3
    ) => {
      const uniforms = {
        color: { value: color },
        matrix: { value: proj_view },
        world_position: { value: worldPosition },
      };

      const material = new RawShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
      });

      return material;
    };

    /************************************************************
     *
     * geometry
     *
     ************************************************************/

    const geometry = new Three.BufferGeometry();
    const indices = new Uint32Array([
      0, 1, 8, 0, 4, 5, 0, 5, 10, 0, 8, 4, 0, 10, 1, 1, 6, 8, 1, 7, 6, 1, 10, 7,
      2, 3, 11, 2, 4, 9, 2, 5, 4, 2, 9, 3, 2, 11, 5, 3, 6, 7, 3, 7, 11, 3, 9, 6,
      4, 8, 9, 5, 11, 10, 6, 9, 8, 7, 10, 11,
    ]);

    const phi = (1.0 + Math.sqrt(5)) / 2;
    const vertices = new Float32Array(
      [
        [phi, 1.0, 0.0],
        [phi, -1.0, 0.0],
        [-phi, 1.0, 0.0],
        [-phi, -1.0, 0.0],
        [0.0, phi, 1.0],
        [0.0, phi, -1.0],
        [0.0, -phi, 1.0],
        [0.0, -phi, -1.0],
        [1.0, 0.0, phi],
        [-1.0, 0.0, phi],
        [1.0, 0.0, -phi],
        [-1.0, 0.0, -phi],
      ].flat()
    );

    const positionAttribute = new Three.Float32BufferAttribute(vertices, 3);

    geometry.setIndex(new Three.BufferAttribute(indices, 1));
    geometry.setAttribute("position", positionAttribute);

    // Scene
    const scene = new Three.Scene();
    scene.background = new Three.Color(0.1, 0.1, 0.1);

    // Camera
    const camera = new Three.PerspectiveCamera(60, 800 / 600, 0.1, 3000);
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);

    // nbody
    const nbody = new rayonNbodyDemo.NBody(numBodies, mode);
    const gotNbodyConditions: NBodyCondition[] = nbody.init_conditions();

    // mesh list
    const mesh_instances = gotNbodyConditions.map(
      (instance: NBodyCondition) => {
        const worldPosition = new Three.Vector3(
          instance.world_position[0],
          instance.world_position[1],
          instance.world_position[2]
        );

        const color = new Three.Color(
          instance.color[0],
          instance.color[1],
          instance.color[2]
        );

        const mesh = new Three.Mesh(
          geometry,
          createMaterial(color, worldPosition)
        );

        scene.add(mesh);

        return mesh;
      }
    );

    /************************************************************
     *
     * Render
     *
     ************************************************************/

    // Todo offscreenCanvas initialize
    interface ForThreeOffscreenCanvas extends OffscreenCanvas {
      style?: { width: number; height: number };
    }
    const _offscreenCanvas: ForThreeOffscreenCanvas = offscreen;
    _offscreenCanvas.style = { width: 0, height: 0 };

    const renderer = new Three.WebGLRenderer({
      canvas: _offscreenCanvas,
    });
    renderer.setSize(800, 600);

    const render = async () => {
      // Todo next rendering

      const nextNbodyPosition: Point3[] = await nbody.next_positions();
      // update mesh positions
      for (let i = 0; i < mesh_instances.length; ++i) {
        mesh_instances[i].material.uniforms.world_position.value =
          new Three.Vector3(
            nextNbodyPosition[i].x,
            nextNbodyPosition[i].y,
            nextNbodyPosition[i].z
          );
        mesh_instances[i].material.uniformsNeedUpdate = true;
      }

      renderer.render(scene, camera);

      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (await switchingRender.current()) {
        await statsBegin();
        await render();
        await statsEnd();
      }
    }
  };

  return Comlink.proxy({
    runRayonNbodyDemo: runRayonNbodyDemo,
  });
};

Comlink.expose(handler);

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  MutableRefObject,
} from "react";
import * as Comlink from "comlink";
import { handler, Handler } from "./worker";
import Stats from "three/examples/jsm/libs/stats.module";

import statsStyle from "@styles/Stats.module.scss";
import demoStyle from "@styles/Demo.module.scss";
import "bulma/css/bulma.css";

/**
 * Execution Mode
 */
export enum ExecutionMode {
  Par,
  ParReduce,
  Seq,
}

// Avoiding Ts Error "Type 'OffscreenCanvas' is not assignable to type 'Transferable'."
declare module "comlink" {
  function transfer<T>(obj: T, transfers: Transferable | OffscreenCanvas[]): T;
}

/**
 * Stats
 *
 */
const useStats: () => [
  statsBegin: () => void,
  statsEnd: () => void,
  StatsComponent: () => JSX.Element
] = () => {
  const [stats, setStats] = useState<Stats | undefined>(undefined);

  const statsBegin = useCallback(() => {
    stats?.begin();
  }, [stats]);

  const statsEnd = useCallback(() => {
    stats?.end();
  }, [stats]);

  useEffect(() => {
    // Stats init
    const stats = Stats();
    stats.dom.style.cssText = ""; // Reset Css
    stats.showPanel(0);
    setStats(() => stats);
  }, []);

  const StatsComponent = useCallback(() => {
    return (
      <div
        className={statsStyle.stats_wrap}
        ref={(ref) => {
          if (stats != undefined && ref != undefined) {
            // Cleanup on redraw
            const childs = ref.children;
            while (childs.length > 0) {
              childs[0].remove();
            }
            ref.appendChild(stats.dom);
          }
        }}
      ></div>
    );
  }, [stats]);

  return [statsBegin, statsEnd, StatsComponent];
};

/**
 * Make Worker
 *
 */
const makeWorker: () => [
  exposed: Comlink.Remote<typeof handler>,
  cleanup: () => void
] = () => {
  const worker = new Worker(new URL("./worker.ts", import.meta.url), {
    type: "module",
  });

  const exposed = Comlink.wrap<typeof handler>(worker);

  const cleanup = () => {
    exposed[Comlink.releaseProxy];
    worker.terminate();
  };

  return [exposed, cleanup];
};

export const useRayonNbodyWorker: (
  numBodies: number,
  mode: ExecutionMode
) => [
  switchingRender: MutableRefObject<() => boolean>,
  canvasRef: HTMLCanvasElement | undefined,
  statsComponent: () => JSX.Element
] = (numBodies, mode) => {
  const [handler, setHandler] = useState<Comlink.Remote<Handler> | undefined>(
    undefined
  );
  const switchingRender = useRef<() => boolean>(() => true);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | undefined>(
    undefined
  );
  const [statsBegin, statsEnd, StatsComponent] = useStats();

  // init
  useEffect(() => {
    const [exposed, cleanup] = makeWorker();
    (async () => {
      const parallel = mode !== ExecutionMode.Seq; // parallel flag
      const handler = (await exposed(parallel)) as Comlink.Remote<Handler>;
      setHandler(() => handler);
    })();
    return cleanup;
  }, [mode]);

  // Handler Effect
  useEffect(() => {
    if (handler != undefined && canvas == undefined) {
      const _canvas = document.createElement("canvas") as HTMLCanvasElement;
      const _offscreen = _canvas.transferControlToOffscreen();
      handler.runRayonNbodyDemo(
        Comlink.transfer(_offscreen, [_offscreen]),
        numBodies,
        mode,
        Comlink.proxy(switchingRender),
        Comlink.proxy(statsBegin),
        Comlink.proxy(statsEnd)
      );

      setCanvas(() => _canvas);
    }
  }, [handler, statsBegin, statsEnd, mode, numBodies, canvas]);

  return [switchingRender, canvas, StatsComponent];
};

/**
 * DemoComponent
 *
 * @param props
 * @returns
 */
export const DemoComponent: (props: {
  numBodies: number;
  mode: ExecutionMode;
}) => JSX.Element = (props) => {
  const [switchingRender, canvas, StatsComponent] = useRayonNbodyWorker(
    props.numBodies,
    props.mode
  );

  const CanvasComponent = () => {
    return (
      <div
        className={statsStyle.stats_wrap}
        ref={(ref) => {
          if (canvas != undefined && ref != undefined) {
            // Cleanup on redraw!
            const childs = ref.children;
            while (childs.length > 0) {
              childs[0].remove();
            }
            ref?.appendChild(canvas);
          }
        }}
      ></div>
    );
  };

  const SwitchingRenderButton: () => JSX.Element = () => {
    const [, _forceUpdate] = useState(true);
    const forceUpdate = () => {
      _forceUpdate((prev) => !prev);
    };

    const label: (sr: MutableRefObject<() => boolean>) => JSX.Element = (
      sr
    ) => {
      if (sr.current()) {
        return <span>Pause</span>;
      } else {
        return <span>Play</span>;
      }
    };

    const buttonClass = () => {
      const paused = [
        "button",
        switchingRender.current() ? "is-warning" : "is-success",
      ].join(" ");

      return [demoStyle.pauseButton, paused].join(" ");
    };

    return (
      <div>
        <div
          onClick={() => {
            const current = switchingRender.current();
            switchingRender.current = () => !current;
            forceUpdate();
          }}
          className={buttonClass()}
        >
          {label(switchingRender)}
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <div className={statsStyle.switchingRender_wrap}>
        <SwitchingRenderButton></SwitchingRenderButton>
      </div>
      <StatsComponent></StatsComponent>
      <CanvasComponent></CanvasComponent>
    </div>
  );
};

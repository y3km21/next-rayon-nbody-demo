# Wasm-Rayon-Nbody-Demo

- [Wasm-Rayon-Nbody-Demo](#wasm-rayon-nbody-demo)
  - [About](#about)
  - [Demo](#demo)
  - [Usage](#usage)
    - [Build](#build)
      - [Simple Usage](#simple-usage)
  - [Original Demo](#original-demo)
    - [nbody-visualize](#nbody-visualize)
    - [nbody-bench](#nbody-bench)
    - [nbody-help](#nbody-help)
    - [cargo bench](#cargo-bench)

## About

This is a library version of [rayon-nbody-demo](https://github.com/rayon-rs/rayon/tree/master/rayon-demo/src/nbody).
Thanks to [wasm-bindgen-rayon](https://github.com/GoogleChromeLabs/wasm-bindgen-rayon), it can be compiled into wasm.

## Demo

todo

## Usage

**⚠ Using:**  [cargo-make](https://github.com/sagiegurari/cargo-make) and [Python](https://www.python.org/)

### Build

```sh
cargo make build-pkg     
```

The packages created in the working directory are

- `pkg` for the multi-thread version
- `pkg-single` for the single-thread version

#### Simple Usage

  ```js

    import { threads } from "wasm-feature-detect";

    let rayonNbodyDemo;

    if (await threads()) {
      rayonNbodyDemo = await import("rayon-nbody-demo");
      await rayonNbodyDemo.default();
      await rayonNbodyDemo.initThreadPool(navigator.hardwareConcurrency);
    } else {
      rayonNbodyDemo = await import("rayon-nbody-demo_single");
      await rayonNbodyDemo.default();
    }

    rayonNbodyDemo.logging_init();

    let numBodies = 1500;

    // ExecutionMode
    // Par : 0
    // ParReduce : 1
    // Seq : 2
    let mode = 0;

    // Nbody
    // If rayonNbodyDemo is single version then second arg is ignored
    // therefore always Seq mode.
    const nbody = new rayonNbodyDemo.NBody(numBodies, mode);
    const gotNBodyConditions = nbody.init_conditions();

    /*Make meshs using nbody init conditions*/

    const nextNbodyPositions = nbody.next_positions();

    /*Update world position of meshs*/
  ```

## Original Demo

  You can do original demo and bench.

### nbody-visualize

```sh
cargo make nbody visualize
```

### nbody-bench

```sh
cargo make nbody bench
```

### nbody-help

```sh
cargo make nbody --help
```

### cargo bench

```sh
cargo make bench
```

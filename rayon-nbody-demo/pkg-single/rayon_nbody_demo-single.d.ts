/* tslint:disable */
/* eslint-disable */
/**
*/
export function logging_init(): void;
/**
*/
export enum ExecutionMode {
  Par,
  ParReduce,
  Seq,
}
/**
*/
export class NBody {
  free(): void;
/**
* @param {number} num_bodies
* @param {number} _mode
*/
  constructor(num_bodies: number, _mode: number);
/**
* @returns {any}
*/
  init_conditions(): any;
/**
* @returns {any}
*/
  next_positions(): any;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_nbody_free: (a: number) => void;
  readonly nbody_new: (a: number, b: number) => number;
  readonly nbody_init_conditions: (a: number) => number;
  readonly nbody_next_positions: (a: number) => number;
  readonly logging_init: () => void;
  readonly __wbindgen_free: (a: number, b: number) => void;
  readonly __wbindgen_malloc: (a: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;

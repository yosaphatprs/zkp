/// <reference types="vite/client" />

interface Window {
  Buffer: typeof Buffer;
  process: any;
}

declare module "circomlibjs" {
  export function buildPoseidon(): Promise<any>;
  export function buildPoseidonOpt(): Promise<any>;
}

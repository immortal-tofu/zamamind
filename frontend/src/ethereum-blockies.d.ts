// ethereum-blockies.d.ts
declare module 'ethereum-blockies' {
  /** Options accepted by ethereum-blockies. */
  export interface BlockiesOptions {
    /** Seed for the RNG – usually an Ethereum address or any string. */
    seed: string;

    /** Primary color in hex (e.g. "#dfe" or "#0055ff"). Optional. */
    color?: string;

    /** Background color. Optional. */
    bgcolor?: string;

    /** Random spot color. Optional. */
    spotcolor?: string;

    /**
     * Icon square dimensions (in pixels) **after** scaling.
     * Default: 8.
     */
    size?: number;

    /**
     * Pixel-multiplier. Each block will be drawn as a square
     * `scale × scale` pixels. Default: 4.
     */
    scale?: number;
  }

  /** Generates and returns a `<canvas>` element (not appended to the DOM). */
  export function create(options: BlockiesOptions): HTMLCanvasElement;

  /** Returns the identicon as a `data:image/png;base64,…` URI. */
  export function toDataUrl(options: BlockiesOptions): string;

  /** CommonJS default export (`const blockies = require("ethereum-blockies")`). */
  const blockies: {
    create: typeof create;
    toDataUrl: typeof toDataUrl;
  };

  export default blockies;
}

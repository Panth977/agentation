// `modern-screenshot` is an OPTIONAL peer dependency. It is loaded lazily via
// dynamic import inside a try/catch (see utils/screenshot.ts) and the library
// works without it (falls back to stroke-only canvas capture). This ambient
// declaration lets the code type-check when the package isn't installed.
declare module "modern-screenshot" {
  export function domToCanvas(
    node: Node,
    options?: Record<string, unknown>,
  ): Promise<HTMLCanvasElement>;
}

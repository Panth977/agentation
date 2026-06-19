// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
  namespace App {}

  // Injected by Vite define (see vite.config.ts)
  const __VERSION__: string;
}

export {};

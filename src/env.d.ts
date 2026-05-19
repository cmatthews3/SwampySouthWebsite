/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly BUTTONDOWN_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

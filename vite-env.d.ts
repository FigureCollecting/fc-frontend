/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SYNC_URL?: string;
  readonly VITE_DEBUG?: string;
  readonly VITE_DEBUG_LEVEL?: string;
  readonly VITE_DEBUG_MODULES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

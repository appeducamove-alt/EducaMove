interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  // adicione outras variáveis aqui...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

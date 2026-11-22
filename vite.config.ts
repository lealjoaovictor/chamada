import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  base: mode === "celular" ? "./" : "/",
  define:
    mode === "celular"
      ? { "import.meta.env.VITE_TOQUE": JSON.stringify("1"), "import.meta.env.VITE_MODELO_EXT": JSON.stringify(".glb.mp4") }
      : {},
  build:
    mode === "celular"
      ? { outDir: "dist-celular", rollupOptions: { output: { inlineDynamicImports: true } } }
      : {},
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  optimizeDeps: {
    exclude: ["@babylonjs/havok"],
  },
}));

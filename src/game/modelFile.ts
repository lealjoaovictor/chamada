// Caminho dos modelos GLB. A versão para celular publica os modelos com outra extensão
// (o servidor só aceita alguns tipos de arquivo), então o carregador recebe o tipo explicitamente.
const EXT = import.meta.env.VITE_MODELO_EXT ?? ".glb";

export function modelFile(name: string): string {
  return `${import.meta.env.BASE_URL}models/${name}${EXT}`;
}

export const MODEL_OPTIONS = { pluginExtension: ".glb" };

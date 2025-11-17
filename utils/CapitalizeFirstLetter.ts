// Util: capitalizar la primera letra de un texto
// Comentarios en español, internals en inglés
export function capitalizeFirst(text: string) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default capitalizeFirst;

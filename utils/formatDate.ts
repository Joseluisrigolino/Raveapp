// Utilities de formato de fecha usados en la app
// Exporta helpers que aceptan ISO string o Date y devuelven string legible
export function formatDateForUI(isoOrDate?: string | Date): string {
  if (!isoOrDate) return "";
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES");
}

// Formato dd/mm/yyyy para inputs donde se necesita ese formato explícito
export function formatDate(date?: Date): string {
  if (!date) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default formatDateForUI;

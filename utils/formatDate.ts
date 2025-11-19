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

// Convierte entradas comunes de fecha a ISO (acepta YYYY-MM-DD, DD/MM/YYYY o Date)
export function parseBirthDateToISO(input?: string | Date): string {
  if (!input) return new Date().toISOString();
  if (input instanceof Date) return new Date(input).toISOString();
  const s = String(input).trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s).toISOString();
  // DD/MM/YYYY or D/M/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const parts = s.split("/");
    const [d, m, y] = parts;
    return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`).toISOString();
  }
  // fallback: try Date parser
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString();
  return new Date().toISOString();
}

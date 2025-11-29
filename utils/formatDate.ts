// utils/formatDate.ts
// Helpers de formato de fecha usados en la app.
// Aceptan ISO string o Date y devuelven strings legibles para UI.

/**
 * Formato corto genérico para UI.
 * Ejemplo: 24/11/2025 (según locale "es-ES").
 */
export function formatDateForUI(isoOrDate?: string | Date): string {
  if (!isoOrDate) return "";

  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(d.getTime())) return "";

  return d.toLocaleDateString("es-ES");
}

/**
 * Formato dd/mm/yyyy explícito.
 * Ejemplo: 24/11/2025
 */
export function formatDate(date?: Date): string {
  if (!date) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Formato largo en español con nombre de mes.
 * Ejemplo: 24 Noviembre 2025
 */
export function formatDateLongEs(isoOrDate?: string | Date): string {
  if (!isoOrDate) return "";

  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(d.getTime())) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("es-ES", { month: "long" });
  const monthCap = month.charAt(0).toUpperCase() + month.slice(1);
  const year = d.getFullYear();

  return `${day} ${monthCap} ${year}`;
}

// Default: formato corto genérico de UI.
export default formatDateForUI;

/**
 * Convierte entradas comunes de fecha a ISO.
 * Acepta:
 * - "YYYY-MM-DD"
 * - "DD/MM/YYYY" o "D/M/YYYY"
 * - Date
 * Si no puede parsear, devuelve now en ISO.
 */
export function parseBirthDateToISO(input?: string | Date): string {
  if (!input) return new Date().toISOString();

  if (input instanceof Date) {
    return new Date(input).toISOString();
  }

  const s = String(input).trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(s).toISOString();
  }

  // DD/MM/YYYY or D/M/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/");
    return new Date(
      `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
    ).toISOString();
  }

  // fallback: que lo intente el parser nativo
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString();

  return new Date().toISOString();
}

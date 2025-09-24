import { ROUTES } from "../routes";

function collectStrings(obj: any): string[] {
  const out: string[] = [];
  if (typeof obj === "string") return [obj];
  if (!obj || typeof obj !== "object") return [];
  for (const k of Object.keys(obj)) {
    out.push(...collectStrings(obj[k]));
  }
  return out;
}

describe("routes constants", () => {
  test("all route values are non-empty strings starting with / and unique", () => {
    const vals = collectStrings(ROUTES).filter((v) => typeof v === "string");
    expect(vals.length).toBeGreaterThan(0);
    for (const v of vals) {
      expect(typeof v).toBe("string");
      expect(v.length).toBeGreaterThan(0);
      expect(v.startsWith("/")).toBeTruthy();
    }
    const dupes = vals.filter((v, i) => vals.indexOf(v) !== i);
    expect(dupes).toEqual([]);
  });

  test("important route keys exist", () => {
    expect(ROUTES).toHaveProperty("MAIN");
    expect(ROUTES).toHaveProperty("ADMIN");
    expect(ROUTES).toHaveProperty("OWNER");
    expect(ROUTES.LOGIN).toHaveProperty("LOGIN");
    expect(ROUTES.MAIN.EVENTS).toHaveProperty("EVENT");
  });
});

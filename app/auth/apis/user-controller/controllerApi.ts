// API for controller users
// Comentarios en español: explicación sencilla de cada función

// imports
import { apiClient, login } from "@/app/apis/apiConfig";
import { ControllerUser } from "@/app/auth/types/ControllerUser";

// helpers
// Normaliza la respuesta del backend y devuelve un array de items
function normalizeItems(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.usuarios)) return data.usuarios;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

// Extrae el username de un item (soporta varios shapes)
function getUsername(item: any): string {
  if (!item) return "";
  if (typeof item === "string") return item;
  return (
    item.nombreUsuario || item.usuario || item.username || item.login || ""
  );
}

// Extrae un id si existe
function getId(item: any): string | undefined {
  const id = item?.id ?? item?.idUsuarioControl ?? item?.idUsuario;
  return id == null ? undefined : String(id);
}

// requests principales

// GET /v1/Usuario/GetUsuariosControl?idUsuarioOrg={id}
// Devuelve la lista de usuarios controladores para una organización
export async function getControllerUsers(
  orgUserId: string
): Promise<ControllerUser[]> {
  const token = await login();
  const resp = await apiClient.get<any>("/v1/Usuario/GetUsuariosControl", {
    headers: { Authorization: `Bearer ${token}` },
    params: { idUsuarioOrg: orgUserId },
  });

  const items = normalizeItems(resp?.data);
  return items
    .map((it) => {
      const username = getUsername(it);
      if (!username) return null;
      return { id: getId(it), username } as ControllerUser;
    })
    .filter(Boolean) as ControllerUser[];
}

// POST /v1/Usuario/CreateUsuarioControl
// Crea un usuario controlador usando el payload que espera el backend
export async function createControllerUser(payload: {
  idUsuarioOrg: string;
  nombreUsuario: string;
  password: string;
}): Promise<{ id?: string } | void> {
  const token = await login();
  const resp = await apiClient.post<any>(
    "/v1/Usuario/CreateUsuarioControl",
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  const data = resp?.data;
  const id =
    data?.id ?? data?.idUsuarioControl ?? data?.Id ?? data?.IdUsuarioControl;
  return id ? { id: String(id) } : undefined;
}

// DELETE /v1/Usuario/DeleteUsuarioControl
// El endpoint espera un body con { idUsuarioOrg, idUsuarioControl }
export async function deleteControllerUser(payload: {
  idUsuarioOrg: string;
  idUsuarioControl: string;
}): Promise<void> {
  const token = await login();
  // axios soporta body en delete usando la propiedad `data` en config
  await apiClient.delete("/v1/Usuario/DeleteUsuarioControl", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: payload,
  });
}

// GET /v1/Usuario/Login?Correo=...&Password=...&IsControl=true
// Valida credenciales para un usuario controlador
export async function loginControllerUser(
  email: string,
  password: string
): Promise<boolean> {
  const token = await login();
  const { data } = await apiClient.get<boolean>("/v1/Usuario/Login", {
    params: { Correo: email, Password: password, IsControl: true },
    headers: { Authorization: `Bearer ${token}` },
  });
  return Boolean(data);
}

// exports
// Las funciones ya se exportan directamente arriba

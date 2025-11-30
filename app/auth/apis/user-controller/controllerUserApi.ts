// app/auth/apis/user-controller/controllerApi.ts
// API helpers para manejar "controller users" (usuarios controladores).
// Acá centralizamos todas las llamadas al backend relacionadas con este tipo de usuario.

import { apiClient, login } from "@/app/apis/apiClient"; // cliente HTTP + login de servicio
import type { ControllerUser } from "@/app/auth/types/ControllerUser"; // shape tipado que usa el front

// ---------------------------
// Tipos auxiliares
// ---------------------------

// Forma de los items "raw" que vienen del backend.
// No sabemos el shape exacto (puede variar), por eso lo dejamos como any pero
// le damos un alias para que el código sea más legible.
type RawControllerUser = any;

// Payload para crear un usuario controlador
export type CreateControllerUserPayload = {
  idUsuarioOrg: string;   // id del usuario organización (dueño del controlador)
  nombreUsuario: string;  // username del controlador
  password: string;       // contraseña inicial
};

// Resultado simplificado al crear un usuario controlador
export type CreateControllerUserResult = {
  id?: string;            // id del nuevo usuario controlador, si el backend lo devuelve
} | undefined;

// Payload para borrar un usuario controlador
export type DeleteControllerUserPayload = {
  idUsuarioOrg: string;   // id del usuario organización
  idUsuarioControl: string; // id del usuario controlador a borrar
};

// ---------------------------
// Helpers internos
// ---------------------------

// buildAuthHeaders: arma el header Authorization para cada request
function buildAuthHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// normalizeItems: toma data arbitraria del backend y devuelve siempre un array
// Soporta varios formatos: array directo, data.usuarios, data.items...
function normalizeItems(data: any): RawControllerUser[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.usuarios)) return data.usuarios;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

// getUsername: trata de extraer un username usable, probando distintas propiedades típicas
function getUsername(item: RawControllerUser): string {
  if (!item) return "";
  if (typeof item === "string") return item;

  // Probamos distintos campos comunes que podría devolver el backend
  return (
    item.nombreUsuario ||
    item.usuario ||
    item.username ||
    item.login ||
    ""
  );
}

// getId: obtiene un id unificado en string desde los distintos posibles campos
function getId(item: RawControllerUser): string | undefined {
  const id = item?.id ?? item?.idUsuarioControl ?? item?.idUsuario;
  return id == null ? undefined : String(id);
}

// extractIdFromResponse: cuando creamos un usuario, el backend puede devolver el id
function extractIdFromResponse(data: any): string | undefined {
  const id =
    data?.id ??
    data?.idUsuarioControl ??
    data?.Id ??
    data?.IdUsuarioControl;

  return id == null ? undefined : String(id);
}

// ---------------------------
// Requests principales
// ---------------------------

// GET /v1/Usuario/GetUsuariosControl?idUsuarioOrg={id}
// Devuelve la lista de usuarios controladores para una organización.
export async function getControllerUsers(
  orgUserId: string
): Promise<ControllerUser[]> {
  // 1) Obtenemos un token de servicio usando login() (no es el login del usuario normal)
  const token = await login();

  // 2) Hacemos la request al endpoint de backend
  const resp = await apiClient.get<any>("/v1/Usuario/GetUsuariosControl", {
    headers: buildAuthHeaders(token),
    params: { idUsuarioOrg: orgUserId },
  });

  // 3) Normalizamos la estructura de respuesta para quedarnos siempre con un array
  const items = normalizeItems(resp?.data);

  // 4) Mapeamos esos items "raw" al tipo ControllerUser que usa el front
  return (
    items
      .map((raw) => {
        const username = getUsername(raw); // tratamos de sacar un username decente
        if (!username) return null;        // si no hay username, descartamos el item

        return {
          id: getId(raw),
          username,
        } as ControllerUser;
      })
      // filtramos nulls (los descartados por falta de username)
      .filter(Boolean) as ControllerUser[]
  );
}

// POST /v1/Usuario/CreateUsuarioControl
// Crea un usuario controlador usando el payload que espera el backend.
export async function createControllerUser(
  payload: CreateControllerUserPayload
): Promise<CreateControllerUserResult> {
  // 1) Token de servicio
  const token = await login();

  // 2) Request POST con el payload tal cual lo espera la API
  const resp = await apiClient.post<any>(
    "/v1/Usuario/CreateUsuarioControl",
    payload,
    {
      headers: {
        ...buildAuthHeaders(token),
        "Content-Type": "application/json",
      },
    }
  );

  // 3) Intentamos extraer el id del usuario creado desde distintos campos posibles
  const id = extractIdFromResponse(resp?.data);

  // 4) Devolvemos un shape simple que el front pueda usar (o undefined si la API no mandó id)
  return id ? { id } : undefined;
}

// DELETE /v1/Usuario/DeleteUsuarioControl
// El endpoint espera un body con { idUsuarioOrg, idUsuarioControl }.
// axios permite mandar body en DELETE usando la propiedad `data` en el config.
export async function deleteControllerUser(
  payload: DeleteControllerUserPayload
): Promise<void> {
  // 1) Token de servicio
  const token = await login();

  // 2) Ejecutamos el delete pasando el payload en `data`
  await apiClient.delete("/v1/Usuario/DeleteUsuarioControl", {
    headers: {
      ...buildAuthHeaders(token),
      "Content-Type": "application/json",
    },
    data: payload,
  });
}

// GET /v1/Usuario/Login?Correo=...&Password=...&IsControl=true
// Valida credenciales para un usuario controlador (login específico de "control").
export async function loginControllerUser(
  email: string,
  password: string
): Promise<boolean> {
  // 1) Token de servicio (para poder invocar el endpoint de login de control)
  const token = await login();

  // 2) Llamada GET con query params: Correo, Password, IsControl=true
  const { data } = await apiClient.get<boolean>("/v1/Usuario/Login", {
    params: {
      Correo: email,
      Password: password,
      IsControl: true,
    },
    headers: buildAuthHeaders(token),
  });

  // 3) Devolvemos true/false según la respuesta del backend
  return Boolean(data);
}

// Nota: las funciones se exportan directamente; no hace falta un export al final.

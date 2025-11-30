import { useCallback, useState } from "react";
import { createControllerUser, getControllerUsers } from "../../apis/user-controller/controllerUserApi";
import { apiClient, login } from "@/app/apis/apiClient";

// Hook simple para crear usuarios controladores
// Comentarios en español, internals en inglés
export default function useCreateUserControllers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const createUser = useCallback(async (payload: { idUsuarioOrg: string; nombreUsuario: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const orgId = payload?.idUsuarioOrg;
      const name = String(payload?.nombreUsuario || "").trim();
      if (!orgId) {
        const e = new Error("idUsuarioOrg requerido para crear un usuario controlador");
        setError(e);
        throw e;
      }

      // Comprobar si ya existe un usuario con ese nombre (case-insensitive)
      // Primero: lista de controladores de la org
      try {
        const existing = await getControllerUsers(orgId);
        if (Array.isArray(existing) && existing.some((u) => String(u.username || "").toLowerCase() === name.toLowerCase())) {
          const err = new Error("El nombre de usuario ya está en uso");
          (err as any).code = "USERNAME_EXISTS";
          setError(err);
          throw err;
        }
      } catch (checkErr: any) {
        if (checkErr?.response?.status === 404) {
          // continuar
        } else {
          // si falla por red/permiso, no abortamos aún: intentaremos una búsqueda global
          // pero si es un error crítico, propagar
          // continuar hacia comprobación global
        }
      }

      // Segundo: intento de búsqueda global en /v1/Usuario/GetUsuario con varias claves
      const tryGlobalByUsername = async () => {
        const rootToken = await login();
        const attempts = [
          { params: { NombreUsuario: name } },
          { params: { nombreUsuario: name } },
          { params: { Usuario: name } },
          { params: { usuario: name } },
          { params: { Login: name } },
          { params: { Mail: name } },
        ];

        for (const cfg of attempts) {
          try {
            const resp = await apiClient.get<any>("/v1/Usuario/GetUsuario", {
              headers: { Authorization: `Bearer ${rootToken}` },
              ...(cfg as any),
            });
            const data = resp?.data;
            if (Array.isArray(data?.usuarios) && data.usuarios.length) return true;
            if (data && typeof data === "object" && (data as any).idUsuario) return true;
          } catch (e: any) {
            if (e?.response?.status === 404) continue;
            // otros errores: seguir intentando otras variantes
            continue;
          }
        }
        // intento por ruta directa
        try {
          const resp2 = await apiClient.get<any>(`/v1/Usuario/GetUsuario/${encodeURIComponent(name)}`, { headers: { Authorization: `Bearer ${await login()}` } });
          const d2 = resp2?.data;
          if (Array.isArray(d2?.usuarios) && d2.usuarios.length) return true;
          if (d2 && typeof d2 === "object" && (d2 as any).idUsuario) return true;
        } catch (e) {
          // ignore
        }

        return false;
      };

      try {
        const existsGlobally = await tryGlobalByUsername();
        if (existsGlobally) {
          const err = new Error("El nombre de usuario ya está en uso");
          (err as any).code = "USERNAME_EXISTS";
          setError(err);
          throw err;
        }
      } catch (globalCheckErr) {
        // si la verificación global falló por un error inesperado, no bloqueamos la creación
      }

      try {
        const res = await createControllerUser(payload);
        return res;
      } catch (createErr: any) {
        // En caso de que el servidor responda con un error genérico
        // intentamos detectar si se trata de un duplicado analizando el body
        try {
          const bodyStr = JSON.stringify(createErr?.response?.data || createErr?.response || createErr || "").toLowerCase();
          const duplicateKeywords = ["ya existe", "ya está en uso", "ya existe el usuario", "user exists", "usuario existe", "duplicate", "duplicado"];
          const looksLikeDuplicate = duplicateKeywords.some((k) => bodyStr.includes(k));

          if (looksLikeDuplicate) {
            const userErr = new Error("El nombre de usuario ya está en uso");
            (userErr as any).code = "USERNAME_EXISTS";
            setError(userErr);
            throw userErr;
          }

          // Si el servidor devolvió 500 en create, mapear también a USERNAME_EXISTS
          if (createErr?.response?.status === 500) {
            const userErr = new Error("El nombre de usuario ya está en uso");
            (userErr as any).code = "USERNAME_EXISTS";
            setError(userErr);
            throw userErr;
          }

          // si no está claro por el body, volver a comprobar la lista de controladores
          try {
            const now = await getControllerUsers(orgId);
            if (Array.isArray(now) && now.some((u) => String(u.username || "").toLowerCase() === name.toLowerCase())) {
              const userErr = new Error("El nombre de usuario ya está en uso");
              (userErr as any).code = "USERNAME_EXISTS";
              setError(userErr);
              throw userErr;
            }
          } catch (checkErr) {
            // si la comprobación falla la ignoramos y caemos al error original
          }

        } catch (inner) {
          // si el error lanzado fue nuestro marcador USERNAME_EXISTS, re-lanzarlo
          if ((inner as any)?.code === "USERNAME_EXISTS") throw inner;
          // otherwise ignore parsing/inspection errors
        }

        // Log para depuración: volcar status y body (esto ayuda a entender por qué recibimos 500)
        try {
          // eslint-disable-next-line no-console
          console.error("createControllerUser - error status:", createErr?.response?.status, "data:", createErr?.response?.data);
        } catch {}

        // si no fue por username duplicado, propagar el error original
        setError(createErr);
        throw createErr;
      }
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createUser, loading, error } as const;
}

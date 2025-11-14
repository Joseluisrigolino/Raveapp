// API para usuarios controladores (controller users) con código simple en inglés
// Comentarios en español para explicar cada parte

// ============
// imports
// ============
import { apiClient, login } from "@/app/apis/apiConfig";
import { ControllerUser } from "@/app/auth/types/ControllerUser";

// ============
// helpers
// ============

// Obtiene un array de la estructura devuelta por el backend (tolerante a varios formatos)
function extractItems(data: any): any[] {
	if (Array.isArray(data)) return data;
	if (Array.isArray(data?.usuarios)) return data.usuarios;
	if (Array.isArray(data?.items)) return data.items;
	return [];
}

// Toma un item y devuelve username (acepta string o diferentes campos)
function pickUsername(item: any): string {
	if (typeof item === "string") return item;
	return (
		item?.nombreUsuario ||
		item?.usuario ||
		item?.username ||
		item?.login ||
		""
	);
}

// Toma un item y devuelve id como string si existe
function pickId(item: any): string | undefined {
	const id = item?.id ?? item?.idUsuarioControl ?? item?.idUsuario;
	return id !== undefined && id !== null ? String(id) : undefined;
}

// ============
// requests principales
// ============

// GET /v1/Usuario/GetUsuariosControl?idUsuarioOrg={id}
// Devuelve lista de controller users normalizada
export async function getControllerUsers(orgUserId: string): Promise<ControllerUser[]> {
	const token = await login();
	const resp = await apiClient.get<any>("/v1/Usuario/GetUsuariosControl", {
		headers: { Authorization: `Bearer ${token}` },
		params: { idUsuarioOrg: orgUserId },
	});

	const items = extractItems(resp?.data);
	return items
		.map((it) => {
			const username = pickUsername(it);
			if (!username) return null;
			return { id: pickId(it), username } as ControllerUser;
		})
		.filter(Boolean) as ControllerUser[];
}

// POST /v1/Usuario/CreateUsuarioControl
// Crea un controller user (mantiene shape del backend en el payload)
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
	const id = data?.id ?? data?.idUsuarioControl ?? data?.Id ?? data?.IdUsuarioControl;
	return id ? { id: String(id) } : undefined;
}

// GET /v1/Usuario/Login?Correo=...&Password=...&IsControl=true
// Devuelve true/false si las credenciales son válidas para controlador
export async function loginControllerUser(email: string, password: string): Promise<boolean> {
	const token = await login();
	const { data } = await apiClient.get<boolean>("/v1/Usuario/Login", {
		params: { Correo: email, Password: password, IsControl: true },
		headers: { Authorization: `Bearer ${token}` },
	});
	return Boolean(data);
}

// ============
// exports
// ============
// (Las funciones ya están exportadas arriba)


import { apiClient, login } from "@/app/apis/apiConfig";
import { ControllerUser } from "@/app/auth/types/ControllerUser";

// GET /v1/Usuario/GetUsuariosControl?idUsuarioOrg={id}
export async function getControllerUsers(idUsuarioOrg: string): Promise<ControllerUser[]> {
	const token = await login();
	const resp = await apiClient.get<any>(
		"/v1/Usuario/GetUsuariosControl",
		{
			headers: { Authorization: `Bearer ${token}` },
			params: { idUsuarioOrg },
		}
	);

	const data = resp?.data;
	// Tolerancia a distintos formatos de respuesta
	const list: any[] = Array.isArray(data)
		? data
		: Array.isArray(data?.usuarios)
			? data.usuarios
			: Array.isArray(data?.items)
				? data.items
				: [];

	return list
		.map((it) => {
			// Aceptar string o object con posibles campos
			if (typeof it === "string") return { username: it } as ControllerUser;
			const username = it?.nombreUsuario ?? it?.usuario ?? it?.username ?? it?.login ?? "";
			const id = it?.id ?? it?.idUsuarioControl ?? it?.idUsuario ?? undefined;
			if (!username) return null;
			return { id: id ? String(id) : undefined, username } as ControllerUser;
		})
		.filter(Boolean) as ControllerUser[];
}

// POST /v1/Usuario/CreateUsuarioControl
// Body: { idUsuarioOrg: string; nombreUsuario: string; password: string }
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
	// Devuelve boolean (true si credenciales válidas para controlador)
	export async function loginControllerUser(correo: string, password: string): Promise<boolean> {
		const token = await login();
		const { data } = await apiClient.get<boolean>(
			"/v1/Usuario/Login",
			{ params: { Correo: correo, Password: password, IsControl: true }, headers: { Authorization: `Bearer ${token}` } }
		);
		return Boolean(data);
	}


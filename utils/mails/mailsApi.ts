// utils/mails/mailsApi.ts
// Cliente para el endpoint de confirmación de email

import { apiClient, login } from "@/utils/apiConfig";

// Payload esperado por el endpoint según Swagger
export interface ConfirmEmailTemplateData {
	name: string;
	confirmationUrl: string;
}

export interface ConfirmEmailRequest {
	to: string;
	templateData: ConfirmEmailTemplateData;
}

/**
 * Envía el correo de confirmación de cuenta.
 * POST /v1/Email/EnviarConfirmarEmail
 * Body:
 * {
 *   to: string,
 *   templateData: {
 *     name: string,
 *     confirmationUrl: string
 *   }
 * }
 */
export async function sendConfirmEmail(params: {
	to: string;
	name: string;
	confirmationUrl: string;
}): Promise<any> {
	const { to, name, confirmationUrl } = params || ({} as any);

	if (!to || !name || !confirmationUrl) {
		throw new Error("Parámetros inválidos: se requieren 'to', 'name' y 'confirmationUrl'.");
	}

	const payload: ConfirmEmailRequest = {
		to,
		templateData: {
			name,
			confirmationUrl,
		},
	};

	// Obtener token como en el resto de utilidades
	const token = await login().catch(() => null);

	const { data } = await apiClient.post(
		"/v1/Email/EnviarConfirmarEmail",
		payload,
		{
			headers: {
				"Content-Type": "application/json",
				Accept: "*/*",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		}
	);
	return data;
}

// También se exporta una variante que recibe el objeto ya armado,
// por si desde la app ya se construye el payload completo.
export async function sendConfirmEmailRaw(payload: ConfirmEmailRequest): Promise<any> {
	if (!payload?.to || !payload?.templateData?.name || !payload?.templateData?.confirmationUrl) {
		throw new Error("Payload inválido para EnviarConfirmarEmail.");
	}
	const token = await login().catch(() => null);
	const { data } = await apiClient.post(
		"/v1/Email/EnviarConfirmarEmail",
		payload,
		{
			headers: {
				"Content-Type": "application/json",
				Accept: "*/*",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		}
	);
	return data;
}

// Export estilo "api" para consistencia con otras utilidades
export const mailsApi = {
	sendConfirmEmail,
	sendConfirmEmailRaw,
};


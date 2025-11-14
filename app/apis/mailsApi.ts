// utils/mails/mailsApi.ts
// Cliente para el endpoint de confirmación de email

import { apiClient, login } from "@/app/apis/apiConfig";

// Payload esperado por el endpoint según Swagger
export interface ConfirmEmailTemplateData {
	name: string;
	confirmationUrl: string;
}

export interface ConfirmEmailRequest {
	to: string;
	templateData: ConfirmEmailTemplateData;
}

// Payload para reestablecer contraseña
export interface RecoveryEmailTemplateData {
	name: string;
	recoveryUrl: string;
}

export interface RecoveryEmailRequest {
	to: string;
	templateData: RecoveryEmailTemplateData;
}

// Generic email (EnvioMailGenerico)
export interface GenericEmailRequest {
	to: string;
	titulo: string;
	cuerpo: string; // puede incluir negritas con markup simple **texto** si el backend lo interpreta, se envía plano acá
	botonUrl?: string;
	botonTexto?: string;
}

/**
 * POST /v1/Email/EnvioMailGenerico
 * Envia un correo genérico con título y cuerpo arbitrarios.
 */
export async function sendGenericEmail(payload: GenericEmailRequest): Promise<any> {
	if (!payload?.to || !payload?.titulo || !payload?.cuerpo) {
		throw new Error("Payload inválido para EnvioMailGenerico: requiere 'to', 'titulo' y 'cuerpo'.");
	}
	const token = await login().catch(() => null);
	const { data } = await apiClient.post(
		"/v1/Email/EnvioMailGenerico",
		{
			to: payload.to,
			titulo: payload.titulo,
			cuerpo: payload.cuerpo,
			botonUrl: payload.botonUrl ?? "",
			botonTexto: payload.botonTexto ?? "",
		},
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

/**
 * Helper para armar el cuerpo del mail de cancelación de entradas.
 * Inserta los valores solicitados, aplicando negritas en nombre de evento, importe y nombre de la app.
 * Los marcadores se reemplazan directamente; si el backend soporta HTML, podría adaptarse.
 */
export function buildCancellationEmailBody(params: {
	nombreUsuario: string; // Nombre y apellido del usuario
	nombreEvento: string;
	importeReembolsado: number; // valor sin cargo de servicio
	fechaCompra: Date | string; // fecha original de la compra
	numeroOperacionMP?: string; // número de operación MercadoPago
}): { titulo: string; cuerpo: string } {
	const {
		nombreUsuario,
		nombreEvento,
		importeReembolsado,
		fechaCompra,
		numeroOperacionMP = "",
	} = params;
	const fecha = (() => {
		try {
			const d = new Date(fechaCompra);
			if (!isNaN(d.getTime())) {
				const dd = String(d.getDate()).padStart(2, '0');
				const mm = String(d.getMonth() + 1).padStart(2, '0');
				const yy = d.getFullYear();
				return `${dd}/${mm}/${yy}`;
			}
			return String(fechaCompra);
		} catch { return String(fechaCompra); }
	})();
	const importeStr = `$ ${importeReembolsado}`;
	const titulo = `RaveApp - Cancelación de entradas a ${nombreEvento}`;
	const cuerpo = `Estimado ${nombreUsuario},\n\nHas cancelado tu/s entrada/s al evento **${nombreEvento}** por un importe de **${importeStr}**, que habias adquirido el dia ${fecha}.\nDicho importe se te ha reembolsado al medio de pago que hayas utilizado en MercadoPago y lo verás acreditado dentro de los 7 dias habiles.\n\nNumero de opercaion de MercadoPago: ${numeroOperacionMP}\n\nAtentamente,\nEl equipo de **RaveApp**`;
	return { titulo, cuerpo };
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

/**
 * Envía el correo de recuperación de contraseña.
 * POST /v1/Email/EnviarRecuperarContrasena
 * Body:
 * {
 *   to: string,
 *   templateData: {
 *     name: string,
 *     recoveryUrl: string
 *   }
 * }
 */
export async function sendPasswordRecoveryEmail(params: {
	to: string;
	name: string;
	recoveryUrl?: string;
}): Promise<any> {
	const { to, name, recoveryUrl = "https://raveapp.com.ar/restablecer-contrasena" } = params || ({} as any);

	if (!to || !name) {
		throw new Error("Parámetros inválidos: se requieren 'to' y 'name'.");
	}

	const payload: RecoveryEmailRequest = {
		to,
		templateData: {
			name,
			recoveryUrl,
		},
	};

	// Obtener token como en el resto de utilidades
	const token = await login().catch(() => null);

	const { data } = await apiClient.post(
		"/v1/Email/EnviarRecuperarContrasena",
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

// También se exporta una variante que recibe el objeto ya armado
export async function sendPasswordRecoveryEmailRaw(payload: RecoveryEmailRequest): Promise<any> {
	if (!payload?.to || !payload?.templateData?.name || !payload?.templateData?.recoveryUrl) {
		throw new Error("Payload inválido para EnviarRecuperarContrasena.");
	}
	const token = await login().catch(() => null);
	const { data } = await apiClient.post(
		"/v1/Email/EnviarRecuperarContrasena",
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
	sendPasswordRecoveryEmail,
	sendPasswordRecoveryEmailRaw,
  sendGenericEmail,
  buildCancellationEmailBody,
};


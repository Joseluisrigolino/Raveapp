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
/**
 * Genera el contenido (texto y opcional HTML) para el correo de cancelación de entradas.
 * Mejora: corrige tildes/typos, formato de fecha, agrega versión HTML con <strong> y <br/>.
 * El endpoint actual solo envía `cuerpo` (texto plano); se incluye `cuerpoHtml` por si en el futuro
 * se habilita soporte HTML. Las asteriscos ** se mantienen para backend que interprete markdown simple.
 */
export function buildCancellationEmailBody(params: {
	nombreUsuario: string; // Nombre y apellido del usuario
	nombreEvento: string;
	importeReembolsado: number; // valor sin cargo de servicio
	fechaCompra: Date | string; // fecha original de la compra
	numeroOperacionMP?: string; // número de operación MercadoPago
}): { titulo: string; cuerpo: string; cuerpoHtml?: string } {
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
				const dd = String(d.getDate()).padStart(2, "0");
				const mm = String(d.getMonth() + 1).padStart(2, "0");
				const yy = d.getFullYear();
				return `${dd}/${mm}/${yy}`;
			}
			return String(fechaCompra);
		} catch {
			return String(fechaCompra);
		}
	})();

	// Formatear importe con separador de miles local si hay soporte, sino fallback.
	const importeStr = (() => {
		try {
			return `$ ${importeReembolsado.toLocaleString("es-AR", {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			})}`;
		} catch {
			return `$ ${importeReembolsado}`;
		}
	})();

	const titulo = `RaveApp - Cancelación de entradas a ${nombreEvento}`;

	// Construcción de líneas en texto plano (usar CRLF para mayor compatibilidad en algunos parsers).
	const lineBreak = "\r\n"; // muchos servidores de correo esperan CRLF
	const partes: string[] = [];
	partes.push(`Estimado/a ${nombreUsuario},`);
	partes.push(
		`Has cancelado tu/s entrada/s al evento **${nombreEvento}** por un importe de **${importeStr}**, adquiridas el día ${fecha}.`
	);
	partes.push(
		`El importe se ha reembolsado al medio de pago que utilizaste en MercadoPago y lo verás acreditado dentro de los próximos 7 días hábiles.`
	);
	if (numeroOperacionMP) {
		partes.push(`Número de operación de MercadoPago: ${numeroOperacionMP}`);
	}
	partes.push(`Atentamente,`);
	partes.push(`El equipo de **RaveApp**`);
	const cuerpo = partes.join(lineBreak + lineBreak); // doble salto entre párrafos

	// Versión HTML (solo si el backend la llegara a soportar en el futuro)
	const cuerpoHtml = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8" /><title>${titulo}</title></head><body style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
	<p>Estimado/a <strong>${nombreUsuario}</strong>,</p>
	<p>Has cancelado tu/s entrada/s al evento <strong>${nombreEvento}</strong> por un importe de <strong>${importeStr}</strong>, adquiridas el día ${fecha}.</p>
	<p>El importe se ha reembolsado al medio de pago que utilizaste en MercadoPago y lo verás acreditado dentro de los próximos 7 días hábiles.</p>
	${numeroOperacionMP ? `<p><strong>Número de operación MercadoPago:</strong> ${numeroOperacionMP}</p>` : ""}
	<p>Atentamente,<br/><strong>El equipo de RaveApp</strong></p>
</body></html>`;

	return { titulo, cuerpo, cuerpoHtml };
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
 * POST /v1/Email/EnviarPassRecoveryEmail
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
		"/v1/Email/EnviarPassRecoveryEmail",
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
		"/v1/Email/EnviarPassRecoveryEmail",
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


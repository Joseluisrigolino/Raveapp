import { apiClient, login } from "@/app/apis/apiClient";

// Tipo base y flexible para una reseña
export type Review = {
	id?: string; // id normalizado (si está disponible)
	idResenia?: string; // id crudo si viene con otro nombre
	idFiesta?: string;
	idUsuario?: string;
	estrellas?: number;
	comentario?: string;
	fecha?: string;
	[k: string]: any;
};

// Resumen de calificaciones por fiesta
export type ReviewsAvg = {
  idFiesta?: string;
  avg: number; // 0..5
  count?: number; // cantidad de reseñas
  [k: string]: any;
};

// GET /v1/Resenia/GetResenias
// Todos los parámetros son opcionales (ver imagen adjunta):
// - IdResenia (string)
// - IdFiesta (string)
// - Estrellas (int)
// - IdUsuario (string)
export async function getResenias(filters?: {
	idResenia?: string;
	idFiesta?: string;
	estrellas?: number;
	idUsuario?: string;
}): Promise<Review[]> {
	const token = await login();

	// Construimos solo los params definidos, con las keys esperadas por el backend (PascalCase)
	const params: Record<string, any> = {};
	if (filters?.idResenia) params.IdResenia = String(filters.idResenia);
	if (filters?.idFiesta) params.IdFiesta = String(filters.idFiesta);
	if (typeof filters?.estrellas === "number") params.Estrellas = Number(filters.estrellas);
	if (filters?.idUsuario) params.IdUsuario = String(filters.idUsuario);

	const resp = await apiClient.get<any>("/v1/Resenia/GetResenias", {
		headers: { Authorization: `Bearer ${token}` },
		params,
	});

	const data = resp?.data;
	// Tolerancia a distintos formatos de respuesta
	const list: any[] = Array.isArray(data)
		? data
		: Array.isArray(data?.resenias)
		? data.resenias
		: Array.isArray(data?.items)
		? data.items
		: [];

	// Normalizamos a un shape mínimo y dejamos pasar el resto del payload
	return list
		.map((it) => {
			if (!it || typeof it !== "object") return null;
			const idRaw = it?.id ?? it?.idResenia ?? it?.IdResenia ?? it?.Id ?? undefined;
			const idFiesta = it?.idFiesta ?? it?.IdFiesta ?? it?.fiestaId ?? undefined;
			const idUsuario = it?.idUsuario ?? it?.IdUsuario ?? it?.usuarioId ?? undefined;
			const estrellas = Number(
				it?.estrellas ?? it?.Estrellas ?? it?.rating ?? it?.score ?? NaN
			);
			const comentario = it?.comentario ?? it?.comentarios ?? it?.texto ?? it?.detalle ?? undefined;
			const fecha = it?.fecha ?? it?.dtResenia ?? it?.createdAt ?? it?.Fecha ?? undefined;

			const review: Review = {
				id: idRaw ? String(idRaw) : undefined,
				idResenia: idRaw ? String(idRaw) : undefined,
				idFiesta: idFiesta ? String(idFiesta) : undefined,
				idUsuario: idUsuario ? String(idUsuario) : undefined,
				estrellas: Number.isFinite(estrellas) ? estrellas : undefined,
				comentario,
				fecha,
				...it,
			};
			return review;
		})
		.filter(Boolean) as Review[];
}

// GET /v1/Resenia/GetAvgResenias
// - Parámetro opcional: IdFiesta (string)
// - Si no se envía, algunos backends devuelven un listado por fiesta
// - Normalizamos el resultado a { idFiesta, avg, count } y dejamos pasar cualquier otro campo
export async function getAvgResenias(opts?: { idFiesta?: string }): Promise<ReviewsAvg[]> {
	const token = await login();

	const params: Record<string, any> = {};
	if (opts?.idFiesta) params.IdFiesta = String(opts.idFiesta);

	const resp = await apiClient.get<any>("/v1/Resenia/GetAvgResenias", {
		headers: { Authorization: `Bearer ${token}` },
		params,
	});

	const data = resp?.data;

		// Helper robusto para parsear números que podrían venir como "4,3"
		const toNumber = (v: any): number => {
			if (typeof v === "number") return v;
			if (typeof v === "string") {
				const n = Number(v.replace?.(",", ".") ?? v);
				return n;
			}
			return NaN;
		};

		// Algunos servicios devuelven un número si se filtra por una fiesta específica
	if (typeof data === "number" || typeof data === "string") {
			const avgNum = toNumber(data);
		return [
			{
				idFiesta: opts?.idFiesta,
				avg: Number.isFinite(avgNum) ? avgNum : 0,
				count: undefined,
				value: data,
			},
		];
	}

	// Determinar colección
		const list: any[] = Array.isArray(data)
		? data
			: Array.isArray((data as any)?.avgResenias)
			? (data as any).avgResenias
		: Array.isArray(data?.items)
		? data.items
		: Array.isArray(data?.resenias)
		? data.resenias
		: data && typeof data === "object"
		? [data]
		: [];

	return list
		.map((it) => {
			if (!it || typeof it !== "object") return null;
			const idFiesta = it?.idFiesta ?? it?.IdFiesta ?? it?.fiestaId ?? it?.Id ?? undefined;
						const avgRaw =
							it?.avg ??
							it?.avgEstrellas ??
							it?.promedio ??
							it?.ratingAvg ??
							it?.rating ??
							it?.score ??
							it?.Avg ??
							it?.value ??
							undefined;
								const countRaw =
									it?.count ??
									it?.cantResenias ??
									it?.cantResenas ??
									it?.cantidad ??
									it?.reviewsCount ??
									it?.Count ??
									undefined;
				const avg = toNumber(avgRaw);
			const count = countRaw !== undefined ? Number(countRaw) : undefined;
			const item: ReviewsAvg = {
				idFiesta: idFiesta ? String(idFiesta) : undefined,
				avg: Number.isFinite(avg) ? avg : 0,
				count: count !== undefined && Number.isFinite(count) ? count : undefined,
				...it,
			};
			return item;
		})
		.filter(Boolean) as ReviewsAvg[];
}

// POST /v1/Resenia
// Crea una reseña para una fiesta.
// Body esperado:
// {
//   idUsuario: string,
//   estrellas: number,
//   comentario?: string,
//   idFiesta: string
// }
export async function postResenia(payload: {
	idUsuario: string;
	estrellas: number;
	comentario?: string;
	idFiesta: string;
}): Promise<Review> {
	const token = await login();

	const bodyCamel = {
		idUsuario: String(payload.idUsuario),
		estrellas: Number(payload.estrellas),
		comentario: payload.comentario ?? "",
		idFiesta: String(payload.idFiesta),
	};
	const bodyPascal = {
		IdUsuario: String(payload.idUsuario),
		Estrellas: Number(payload.estrellas),
		Comentario: payload.comentario ?? "",
		IdFiesta: String(payload.idFiesta),
	};

	// Preparar intentos con variantes de payload/endpoint para mejorar compatibilidad
	const guidUpper = (s: string) => String(s || "").toUpperCase();
	const attempts: Array<{ endpoint: string; body: any; note: string }> = [
		{ endpoint: "/v1/Resenia", body: bodyCamel, note: "camel" },
		{ endpoint: "/v1/Resenia", body: bodyPascal, note: "pascal" },
		// Omitir IdUsuario (algunos backends lo infieren del token)
		{ endpoint: "/v1/Resenia", body: { Estrellas: Number(payload.estrellas), Comentario: payload.comentario ?? "", IdFiesta: String(payload.idFiesta) }, note: "pascal_sin_IdUsuario" },
		// Alternativas de clave para comentario
		{ endpoint: "/v1/Resenia", body: { IdUsuario: String(payload.idUsuario), Estrellas: Number(payload.estrellas), Comentarios: payload.comentario ?? "", IdFiesta: String(payload.idFiesta) }, note: "Comentarios" },
		{ endpoint: "/v1/Resenia", body: { IdUsuario: String(payload.idUsuario), Estrellas: Number(payload.estrellas), Detalle: payload.comentario ?? "", IdFiesta: String(payload.idFiesta) }, note: "Detalle" },
		{ endpoint: "/v1/Resenia", body: { IdUsuario: String(payload.idUsuario), Estrellas: Number(payload.estrellas), Texto: payload.comentario ?? "", IdFiesta: String(payload.idFiesta) }, note: "Texto" },
		// GUIDs en mayúscula
		{ endpoint: "/v1/Resenia", body: { IdUsuario: guidUpper(payload.idUsuario), Estrellas: Number(payload.estrellas), Comentario: payload.comentario ?? "", IdFiesta: guidUpper(payload.idFiesta) }, note: "pascal_guid_upper" },
		// Endpoint alternativo común
		{ endpoint: "/v1/Resenia/Create", body: bodyPascal, note: "pascal_endpoint_create" },
	];

	let resp: any = null;
	let lastErr: any = null;
	let tried: Array<{ endpoint: string; note: string; status?: number; message?: string }> = [];
	for (const at of attempts) {
		try {
			// Loguear SIEMPRE el payload con el formato pedido justo antes de cada intento
			try {
				const asCamel = {
					idUsuario: String(payload.idUsuario),
					estrellas: Number(payload.estrellas),
					comentario: payload.comentario ?? "",
					idFiesta: String(payload.idFiesta),
				};
				console.log('[postResenia] intentando POST', { endpoint: at.endpoint, note: at.note, body: asCamel });
			} catch {}
			resp = await apiClient.post<any>(at.endpoint, at.body, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
					accept: "*/*",
				},
			});
			// Log cuál intento funcionó
			try { console.log('[postResenia] intento OK', { endpoint: at.endpoint, note: at.note }); } catch {}
			lastErr = null;
			break;
		} catch (e: any) {
			lastErr = e;
			tried.push({ endpoint: at.endpoint, note: at.note, status: e?.response?.status, message: e?.message });
		}
	}

	if (!resp) {
		try { console.log('[postResenia] todos los intentos fallaron', { tried }); } catch {}
		throw lastErr || new Error('postResenia failed');
	}

	const data = resp?.data;
	// Si el backend devuelve el recurso creado, normalizamos con la misma lógica que getResenias
	const item = Array.isArray(data) ? data[0] : data;
	if (!item || typeof item !== "object") {
		// Fallback mínimo con el payload enviado
		return {
			idUsuario: String(payload.idUsuario),
			idFiesta: String(payload.idFiesta),
			estrellas: Number(payload.estrellas),
			comentario: payload.comentario ?? "",
		} as Review;
	}

	const idRaw = item?.id ?? item?.idResenia ?? item?.IdResenia ?? item?.Id ?? undefined;
	const idFiesta = item?.idFiesta ?? item?.IdFiesta ?? item?.fiestaId ?? payload.idFiesta;
	const idUsuario = item?.idUsuario ?? item?.IdUsuario ?? item?.usuarioId ?? payload.idUsuario;
	const estrellas = Number(
		item?.estrellas ?? item?.Estrellas ?? payload.estrellas ?? NaN
	);
	const comentario = item?.comentario ?? item?.comentarios ?? item?.texto ?? item?.detalle ?? payload.comentario ?? "";
	const fecha = item?.fecha ?? item?.dtResenia ?? item?.createdAt ?? item?.Fecha ?? undefined;

	return {
		id: idRaw ? String(idRaw) : undefined,
		idResenia: idRaw ? String(idRaw) : undefined,
		idFiesta: idFiesta ? String(idFiesta) : undefined,
		idUsuario: idUsuario ? String(idUsuario) : undefined,
		estrellas: Number.isFinite(estrellas) ? estrellas : payload.estrellas,
		comentario,
		fecha,
		...item,
	} as Review;
}

// PUT /v1/Resenia
// Actualiza una reseña existente del usuario para una fiesta.
// Body esperado:
// {
//   idResenia: string,
//   estrellas: number,
//   comentario?: string
// }
export async function putResenia(payload: {
	idResenia: string;
	estrellas: number;
	comentario?: string;
}): Promise<Review> {
	const token = await login();

	const bodyCamel = {
		idResenia: String(payload.idResenia),
		estrellas: Number(payload.estrellas),
		comentario: payload.comentario ?? "",
	};
	const bodyPascal = {
		IdResenia: String(payload.idResenia),
		Estrellas: Number(payload.estrellas),
		Comentario: payload.comentario ?? "",
	};

	let resp: any;
	let sentBody: any = bodyCamel;
	try {
		resp = await apiClient.put<any>("/v1/Resenia", bodyCamel, {
			headers: { Authorization: `Bearer ${token}` },
		});
	} catch (e) {
		try {
			sentBody = bodyPascal;
			resp = await apiClient.put<any>("/v1/Resenia", bodyPascal, {
				headers: { Authorization: `Bearer ${token}` },
			});
		} catch (e2) {
			try { console.log('[putResenia] ambos intentos fallaron', { e: (e as any)?.message, e2: (e2 as any)?.message }); } catch {}
			throw e2;
		}
	}

	const data = resp?.data;
	const item = Array.isArray(data) ? data[0] : data;
	if (!item || typeof item !== "object") {
		// Fallback mínimo: devolvemos payload mapeado a Review
		return {
			id: String(payload.idResenia),
			idResenia: String(payload.idResenia),
			estrellas: Number(payload.estrellas),
			comentario: payload.comentario ?? "",
			...data,
		} as Review;
	}

	const idRaw = item?.id ?? item?.idResenia ?? item?.IdResenia ?? item?.Id ?? payload.idResenia;
	const idFiesta = item?.idFiesta ?? item?.IdFiesta ?? item?.fiestaId ?? undefined;
	const idUsuario = item?.idUsuario ?? item?.IdUsuario ?? item?.usuarioId ?? undefined;
	const estrellas = Number(item?.estrellas ?? item?.Estrellas ?? payload.estrellas ?? NaN);
	const comentario = item?.comentario ?? item?.comentarios ?? item?.texto ?? item?.detalle ?? payload.comentario ?? "";
	const fecha = item?.fecha ?? item?.dtResenia ?? item?.updatedAt ?? item?.Fecha ?? undefined;

	return {
		id: idRaw ? String(idRaw) : undefined,
		idResenia: idRaw ? String(idRaw) : undefined,
		idFiesta: idFiesta ? String(idFiesta) : undefined,
		idUsuario: idUsuario ? String(idUsuario) : undefined,
		estrellas: Number.isFinite(estrellas) ? estrellas : payload.estrellas,
		comentario,
		fecha,
		...item,
	} as Review;
}

// DELETE /v1/Resenia (variantes)
// Elimina una reseña por IdResenia.
// Estrategia: intentos con
// 1) DELETE con params { IdResenia }
// 2) DELETE con body { IdResenia }
// 3) POST a /v1/Resenia/Delete { IdResenia }
// 4) POST a /v1/Resenia/Eliminar { IdResenia }
// Versión simple: el backend elimina con DELETE /v1/Resenia/{id}
export async function deleteResenia(idResenia: string): Promise<{ ok: boolean; idResenia: string }> {
	const token = await login();
	const id = String(idResenia || "").trim();
	if (!id) throw new Error('deleteResenia: idResenia vacío');

	const attempts: Array<() => Promise<any>> = [
		// 1) DELETE /v1/Resenia/{id}
		() => apiClient.delete(`/v1/Resenia/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` } }),
		// 2) DELETE /v1/Resenia with query param IdResenia
		() => apiClient.delete(`/v1/Resenia`, { headers: { Authorization: `Bearer ${token}` }, params: { IdResenia: id } }),
		// 3) DELETE /v1/Resenia with body { IdResenia } (some servers accept body on DELETE)
		() => apiClient.request({ url: '/v1/Resenia', method: 'DELETE', headers: { Authorization: `Bearer ${token}` }, data: { IdResenia: id } }),
		// 4) POST /v1/Resenia/Delete { IdResenia }
		() => apiClient.post('/v1/Resenia/Delete', { IdResenia: id }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }),
		// 5) POST /v1/Resenia/Eliminar { IdResenia }
		() => apiClient.post('/v1/Resenia/Eliminar', { IdResenia: id }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }),
	];

	let lastErr: any = null;
	for (const fn of attempts) {
		try {
			try { console.log('[deleteResenia] trying delete variant'); } catch {}
			const resp = await fn();
			try { console.log('[deleteResenia] success', { status: resp?.status, data: resp?.data }); } catch {}
			return { ok: true, idResenia: id, ...resp?.data };
		} catch (e: any) {
			lastErr = e;
			try { console.log('[deleteResenia] attempt error', { message: e?.message, status: e?.response?.status, data: e?.response?.data }); } catch {}
			// continue to next attempt
		}
	}

	try { console.log('[deleteResenia] all attempts failed'); } catch {}
	throw lastErr || new Error('deleteResenia failed');
}


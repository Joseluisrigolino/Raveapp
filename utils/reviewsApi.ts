import { apiClient, login } from "@/app/apis/apiConfig";

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

	const body = {
		idUsuario: String(payload.idUsuario),
		estrellas: Number(payload.estrellas),
		comentario: payload.comentario ?? "",
		idFiesta: String(payload.idFiesta),
	};

	const resp = await apiClient.post<any>("/v1/Resenia", body, {
		headers: { Authorization: `Bearer ${token}` },
	});

	const data = resp?.data;
	// Si el backend devuelve el recurso creado, normalizamos con la misma lógica que getResenias
	const item = Array.isArray(data) ? data[0] : data;
	if (!item || typeof item !== "object") {
		// Fallback mínimo con el payload enviado
		return {
			idUsuario: body.idUsuario,
			idFiesta: body.idFiesta,
			estrellas: body.estrellas,
			comentario: body.comentario,
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


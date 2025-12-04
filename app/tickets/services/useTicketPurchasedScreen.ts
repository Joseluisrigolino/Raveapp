// app/tickets/services/purchased/useTicketPurchasedScreen.ts
import { useEffect, useMemo, useState } from "react";
import { Alert, Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { useAuth } from "@/app/auth/AuthContext";
import {
  fetchEventById,
  EventItemWithExtras,
} from "@/app/events/apis/eventApi";
import { getEntradasUsuario } from "@/app/auth/userApi";
import {
  getTipoMap,
  solicitarReembolso,
} from "@/app/events/apis/entradaApi";
import {
  mailsApi,
  buildCancellationEmailBody,
} from "@/app/apis/mailsApi";
import { mediaApi } from "@/app/apis/mediaApi";
import {
  getResenias,
  postResenia,
  putResenia,
  deleteResenia,
  Review,
} from "@/utils/reviewsApi";

export type UiUserEntry = {
  idEntrada: string;
  idEvento?: string;
  idFecha?: string;
  mdQR?: string;
  tipoCd?: number;
  tipoDs?: string;
  precio?: number;
  nroEntrada?: number;
  qrImageUrl?: string;
  mediaId?: string;
  estadoCd?: number;
  estadoDs?: string;
  idFiesta?: string;
  compraId?: string;
  dtInsert?: string;
};

const sanitizeUuid = (v: any): string | null => {
  const raw = String(v ?? "").trim();
  if (!raw) return null;
  const compact = raw.replace(/[\s\r\n\t]+/g, "");
  const clean = compact.replace(/[^0-9a-fA-F-]/g, "");
  if (/^[0-9a-fA-F]{32}$/.test(clean)) {
    const p1 = clean.slice(0, 8);
    const p2 = clean.slice(8, 12);
    const p3 = clean.slice(12, 16);
    const p4 = clean.slice(16, 20);
    const p5 = clean.slice(20);
    return `${p1}-${p2}-${p3}-${p4}-${p5}`.toLowerCase();
  }
  if (
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      clean
    )
  ) {
    return clean.toLowerCase();
  }
  return clean || null;
};

const getText = (v: any): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object") {
    return (
      getText(v?.nombre) ||
      getText(v?.dsNombre) ||
      getText(v?.localidad) ||
      getText(v?.municipio) ||
      getText(v?.provincia) ||
      ""
    );
  }
  return "";
};

const formatDateEs = (raw: string | undefined | null): string => {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const tryList = [s];
  const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (m) {
    const d = m[1].padStart(2, "0");
    const mo = m[2].padStart(2, "0");
    const y = m[3];
    tryList.push(`${y}-${mo}-${d}T12:00:00`);
  }
  for (const cand of tryList) {
    const dt = new Date(cand);
    if (!isNaN(dt.getTime())) {
      const diaSemana = [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
      ][dt.getDay()];
      const dia = dt.getDate().toString().padStart(2, "0");
      const meses = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ];
      const mes = meses[dt.getMonth()];
      const anio = dt.getFullYear();
      return `${diaSemana}, ${dia} de ${mes}, ${anio}`;
    }
  }
  return s;
};

const formatTicketCode = (n: number) => `#${String(n).padStart(3, "0")}`;

export function useTicketPurchasedScreen() {
  const {
    id,
    eventId,
    count,
    idCompra,
    estadoCd,
    openReview,
  } = useLocalSearchParams<{
    id?: string;
    eventId?: string;
    count?: string;
    idCompra?: string;
    estadoCd?: string;
    openReview?: string;
  }>();

  const { user } = useAuth();

  const [eventData, setEventData] = useState<EventItemWithExtras | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const ticketsCount =
    typeof count === "string" && count.trim()
      ? Number(count)
      : undefined;
  const [entries, setEntries] = useState<UiUserEntry[]>([]);

  // Review state
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [readOnlyReview, setReadOnlyReview] = useState(false);
  const [reviewLoaded, setReviewLoaded] = useState(false);

  // Refund state
  const [showRefund, setShowRefund] = useState(false);
  const [refundChecked, setRefundChecked] = useState(false);
  const [refundBlockedReason, setRefundBlockedReason] = useState<
    string | null
  >(null);
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [showRefundSuccess, setShowRefundSuccess] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number | null>(
    null
  );
  const [refundInfoMessage, setRefundInfoMessage] = useState<string | null>(
    null
  );

  const userIdForReview: string | null =
    (user as any)?.id ??
    (user as any)?.idUsuario ??
    (user as any)?.userId ??
    null;

  // Dirección para UI
  const addressDisplay = useMemo(() => {
    if (!eventData) return "";
    const parts = [
      getText(eventData?.address),
      getText((eventData as any)?.localidad),
      getText((eventData as any)?.municipio),
      getText((eventData as any)?.provincia),
    ]
      .map((s) => (s || "").trim())
      .filter(Boolean);
    const dedup: string[] = [];
    for (const p of parts) if (!dedup.includes(p)) dedup.push(p);
    return dedup.join(", ");
  }, [eventData]);

  const openMapsDirections = () => {
    if (!eventData) return;
    const pieces = [
      getText(eventData?.address),
      getText((eventData as any)?.localidad),
      getText((eventData as any)?.municipio),
      getText((eventData as any)?.provincia),
      "Argentina",
    ]
      .map((s) => (s || "").trim())
      .filter(Boolean);
    const uniq: string[] = [];
    for (const p of pieces) if (!uniq.includes(p)) uniq.push(p);
    const destination =
      uniq.join(", ") || eventData?.title || "Argentina";
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      destination
    )}`;
    Linking.openURL(url);
  };

  // Fiesta para reseñas
  const fiestaIdForReview: string | null = useMemo(() => {
    if (Array.isArray(entries) && entries.length > 0) {
      const ff = entries.find((e) => !!e.idFiesta)?.idFiesta;
      if (ff) return sanitizeUuid(ff);
    }
    const raw = (eventData as any)?.__raw;
    const fromRaw =
      raw?.idFiesta ||
      raw?.fiestaId ||
      raw?.id_fiesta ||
      raw?.fiesta?.idFiesta;
    if (fromRaw) return sanitizeUuid(fromRaw);
    return null;
  }, [entries, eventData]);

  const handleSubmitReview = async () => {
    const trimmed = (comment ?? "").trim();
    if (!userIdForReview) {
      Alert.alert(
        "Sesión requerida",
        "No encontramos tu usuario. Volvé a iniciar sesión."
      );
      return;
    }

    const rawFiestaCandidate =
      fiestaIdForReview ||
      (entries.find((e) => !!e.idFiesta)?.idFiesta
        ? String(entries.find((e) => !!e.idFiesta)!.idFiesta)
        : undefined) ||
      ((eventData as any)?.__raw?.idFiesta ||
      (eventData as any)?.__raw?.fiestaId
        ? String(
            (eventData as any).__raw.idFiesta ||
              (eventData as any).__raw.fiestaId
          )
        : undefined) ||
      (eventId ? String(eventId) : undefined);

    const fiestaIdToSend = sanitizeUuid(rawFiestaCandidate);

    if (!fiestaIdToSend) {
      Alert.alert(
        "Datos incompletos",
        "No encontramos la fiesta de esta entrada. Reabrí la pantalla e intentá nuevamente."
      );
      try {
        console.log("[handleSubmitReview] missing fiestaId", {
          fiestaIdForReview,
          fromEntries: entries.find((e) => e.idFiesta)?.idFiesta,
          fromEventRaw:
            (eventData as any)?.__raw?.idFiesta ||
            (eventData as any)?.__raw?.fiestaId,
          eventId,
        });
      } catch (e) {
        if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
          console.warn("[useTicketPurchasedScreen] log failed", e);
        }
      }
      return;
    }

    const uuidOk =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
        fiestaIdToSend
      );
    if (!uuidOk) {
      try {
        console.log(
          "[handleSubmitReview] fiestaId no estándar tras sanitizar",
          {
            rawFiestaCandidate,
            fiestaIdToSend,
            len: fiestaIdToSend.length,
          }
        );
      } catch (e) {
        if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
          console.warn("[useTicketPurchasedScreen] log failed", e);
        }
      }
    }

    if (rating <= 0) {
      Alert.alert(
        "Calificación requerida",
        "Por favor seleccioná al menos 1 estrella."
      );
      return;
    }
    if (trimmed.length === 0) {
      Alert.alert(
        "Comentario requerido",
        "Por favor escribí tu reseña."
      );
      return;
    }

    try {
      setSubmitting(true);
      try {
        console.log("[handleSubmitReview] sending review", {
          userIdForReview,
          fiestaIdToSend,
          rating,
          comentarioLen: trimmed.length,
          hasExisting: !!userReview,
        });
        console.log(
          "[handleSubmitReview] payload (primer intento POST) =>",
          {
            idUsuario: String(userIdForReview),
            estrellas: rating,
            comentario: trimmed,
            idFiesta: String(fiestaIdToSend),
          }
        );
      } catch (e) {
        if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
          console.warn("[useTicketPurchasedScreen] log failed", e);
        }
      }

      let existing = userReview as Review | null;
      if (!existing) {
        try {
          const list = await getResenias({
            idUsuario: String(userIdForReview),
            idFiesta: String(fiestaIdToSend),
          });
          existing =
            Array.isArray(list) && list.length ? list[0] : null;
          if (existing) {
            try {
              console.log(
                "[handleSubmitReview] preflight encontró reseña existente, usaremos PUT",
                {
                  idResenia: existing.idResenia || existing.id,
                }
              );
            } catch (e) {
              if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
                console.warn("[useTicketPurchasedScreen] log failed", e);
              }
            }
          }
        } catch (e) {
          if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
            console.warn("[useTicketPurchasedScreen] getResenias failed", e);
          }
        }
      }

      if (existing && (existing.idResenia || existing.id)) {
        const updated = await putResenia({
          idResenia: String(existing.idResenia || existing.id),
          estrellas: rating,
          comentario: trimmed,
        });
        try {
          setUserReview(updated);
        } catch (e) {
          if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
            console.warn("[useTicketPurchasedScreen] setUserReview failed", e);
          }
        }
        setShowReview(false);
        Alert.alert("Listo", "Tu reseña fue actualizada.");
      } else {
        let created: Review | null = null;
        let originalError: any = null;
        try {
          created = await postResenia({
            idUsuario: String(userIdForReview),
            idFiesta: String(fiestaIdToSend),
            estrellas: rating,
            comentario: trimmed,
          });
        } catch (e1) {
          originalError = e1;
          const eventGuid =
            typeof eventId === "string" ? eventId : undefined;
          if (
            eventGuid &&
            eventGuid.toLowerCase() !== fiestaIdToSend.toLowerCase()
          ) {
            try {
              console.log(
                "[handleSubmitReview] retry con eventId como IdFiesta",
                { eventGuid, fiestaIdToSend }
              );
            } catch (e) {
              if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
                console.warn("[useTicketPurchasedScreen] log failed", e);
              }
            }
            try {
              console.log(
                "[handleSubmitReview] payload (fallback con eventId) =>",
                {
                  idUsuario: String(userIdForReview),
                  estrellas: rating,
                  comentario: trimmed,
                  idFiesta: String(eventGuid),
                }
              );
            } catch (e) {
              if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
                console.warn("[useTicketPurchasedScreen] log failed", e);
              }
            }
            try {
              created = await postResenia({
                idUsuario: String(userIdForReview),
                idFiesta: String(eventGuid),
                estrellas: rating,
                comentario: trimmed,
              });
            } catch (e2) {
              try {
                console.log(
                  "[handleSubmitReview] fallback eventId también falló",
                  {
                    e1: (e1 as any)?.message,
                    e2: (e2 as any)?.message,
                  }
                );
              } catch (err) {
                if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
                  console.warn("[useTicketPurchasedScreen] log failed", err);
                }
              }
              throw e2;
            }
          } else {
            throw e1;
          }
        }
        if (!created) throw originalError || new Error("No se pudo crear la reseña");
        try {
          setUserReview(created);
        } catch (e) {
          if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
            console.warn("[useTicketPurchasedScreen] setUserReview failed", e);
          }
        }
        setShowReview(false);
        Alert.alert("¡Gracias!", "Tu reseña fue enviada correctamente.");
      }
    } catch (e: any) {
      try {
        console.log("[handleSubmitReview] error details:", {
          fiestaIdForReview,
          userIdForReview,
          rating,
          comentarioLen: trimmed.length,
          errorMessage: e?.message,
          status: e?.response?.status,
          responseData: e?.response?.data,
        });
      } catch (err) {
        if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
          console.warn("[useTicketPurchasedScreen] log failed", err);
        }
      }
      Alert.alert(
        "Error",
        "No pudimos procesar tu reseña. Intenta nuevamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Traer reseña existente
  useEffect(() => {
    (async () => {
      try {
        setReviewLoaded(false);
        if (!fiestaIdForReview || !userIdForReview) return;
        const list = await getResenias({
          idUsuario: String(userIdForReview),
          idFiesta: String(fiestaIdForReview),
        });
        const first =
          Array.isArray(list) && list.length ? list[0] : null;
        setUserReview(first);
      } catch (e) {
        if (typeof __DEV__ !== "undefined" && (__DEV__ as any)) {
          console.warn("[useTicketPurchasedScreen] getResenias failed", e);
        }
      } finally {
        setReviewLoaded(true);
      }
    })();
  }, [fiestaIdForReview, userIdForReview]);

  // Abrir modal auto si viene de menú
  useEffect(() => {
    if (!openReview) return;
    if (!reviewLoaded) return;
    if (!fiestaIdForReview) return;
    if (openReview && typeof openReview === "string") {
      const has = !!userReview;
      if (has) {
        setRating(Number(userReview?.estrellas || 0));
        setComment(String(userReview?.comentario || ""));
        setReadOnlyReview(false);
        setShowReview(true);
      } else {
        setRating(0);
        setComment("");
        setReadOnlyReview(false);
        setShowReview(true);
      }
    }
  }, [openReview, userReview, reviewLoaded, fiestaIdForReview]);

  // Cargar evento + entradas
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let evt: EventItemWithExtras | null = null;
        if (eventId) {
          evt = await fetchEventById(String(eventId));
          setEventData(evt);
        } else {
          setEventData(null);
        }

        const userId: string | null =
          (user as any)?.id ?? (user as any)?.idUsuario ?? null;
        if (userId) {
          const raw = await getEntradasUsuario(String(userId));
          const tipoMap = await getTipoMap().catch(
            () => new Map<number, string>()
          );

          const getEventId = (r: any): string | null => {
            const ev = r?.evento ?? r?.event ?? null;
            const id =
              ev?.idEvento ??
              ev?.id ??
              r?.idEvento ??
              r?.eventId ??
              r?.id_evento;
            const s = String(id ?? "").trim();
            return s ? s : null;
          };

          const getCompraId = (r: any): string | null => {
            const idc = r?.idCompra ?? r?.compra?.idCompra ?? r?.pago?.idCompra;
            const s = String(idc ?? "").trim();
            return s ? s : null;
          };

          const getDtInsert = (r: any): string | null => {
            const cands = [
              r?.dtInsert,
              r?.DtInsert,
              r?.dt_insert,
              r?.fechaCompra,
              r?.fecha_compra,
              r?.createdAt,
              r?.created_at,
              r?.pago?.dtInsert,
              r?.compra?.dtInsert,
            ];
            for (const v of cands) {
              const s = String(v ?? "").trim();
              if (s) return s;
            }
            return null;
          };

          const getFiestaId = (r: any): string | null => {
            const tryVal = (v: any): string | null => {
              const s = String(v ?? "").trim();
              return s ? s : null;
            };
            const direct =
              tryVal(r?.idFiesta) ||
              tryVal(r?.fiestaId) ||
              tryVal(r?.id_fiesta);
            if (direct) return direct;

            const fi = r?.fiesta ?? r?.Fiesta;
            const fromFi =
              tryVal(fi?.idFiesta) ||
              tryVal(fi?.id_fiesta) ||
              tryVal(fi?.id) ||
              tryVal(fi?.IdFiesta);
            if (fromFi) return fromFi;

            const ev = r?.evento ?? r?.event;
            const fromEv =
              tryVal(ev?.idFiesta) ||
              tryVal(ev?.fiestaId) ||
              tryVal(ev?.id_fiesta) ||
              tryVal(ev?.Fiesta?.idFiesta) ||
              tryVal(ev?.fiesta?.idFiesta);
            if (fromEv) return fromEv;

            const ent = r?.entrada ?? r?.ticket;
            const fromEnt =
              tryVal(ent?.idFiesta) ||
              tryVal(ent?.fiestaId) ||
              tryVal(ent?.fiesta?.idFiesta) ||
              tryVal(ent?.fecha?.fiesta?.idFiesta);
            if (fromEnt) return fromEnt;

            const fromFecha =
              tryVal(r?.fecha?.fiesta?.idFiesta) ||
              tryVal(r?.fecha?.idFiesta);
            if (fromFecha) return fromFecha;

            const fromEvtRaw =
              (evt as any)?.__raw?.idFiesta ||
              (evt as any)?.__raw?.fiestaId;
            if (fromEvtRaw) return fromEvtRaw;
            return null;
          };

          const all = Array.isArray(raw) ? raw : [];
          const filteredByEvent = all.filter((r) => {
            if (!eventId) return true;
            const eid = getEventId(r);
            return eid ? String(eid) === String(eventId) : false;
          });

          const filtered = filteredByEvent.filter((r) => {
            if (!idCompra) return true;
            const cid = getCompraId(r);
            return cid ? String(cid) === String(idCompra) : false;
          });

          const estadoFilter =
            typeof estadoCd === "string" && estadoCd.trim()
              ? Number(estadoCd)
              : undefined;

          const filteredByEstado =
            typeof estadoFilter === "number"
              ? filtered.filter((r) => {
                  const cd = Number(
                    r?.cdEstado ?? r?.estado?.cdEstado ?? NaN
                  );
                  return !isNaN(cd) && cd === estadoFilter;
                })
              : filtered;

          const mapped: UiUserEntry[] = filteredByEstado.map(
            (r: any) => {
              const idEntrada = String(
                r?.idEntrada ??
                  r?.entrada?.idEntrada ??
                  r?.id_entrada ??
                  ""
              );
              const idEvento = getEventId(r) || undefined;
              const idFecha = String(
                r?.idFecha ??
                  r?.fecha?.idFecha ??
                  r?.entrada?.fecha?.idFecha ??
                  r?.id_fecha ??
                  ""
              );
              const mdQR = String(
                r?.mdQR ??
                  r?.qr ??
                  r?.codigoQr ??
                  r?.cod_qr ??
                  ""
              )
                .trim()
                .toString() || undefined;
              const tipo = r?.tipo ?? r?.entrada?.tipo ?? null;
              const tipoCd = Number(
                tipo?.cdTipo ??
                  r?.cdTipo ??
                  r?.tipoEntrada ??
                  NaN
              );
              const tipoDs =
                String(
                  tipo?.dsTipo ??
                    r?.dsTipo ??
                    (Number.isFinite(tipoCd)
                      ? tipoMap.get(tipoCd as number) ?? ""
                      : "")
                )
                  .trim()
                  .toString() || undefined;
              const precio = Number(
                r?.precio ?? r?.entrada?.precio ?? NaN
              );
              const nroEntradaRaw = Number(
                r?.nroEntrada ??
                  r?.entrada?.nroEntrada ??
                  r?.numero ??
                  r?.nro ??
                  NaN
              );
              const estadoCdRaw = Number(
                r?.cdEstado ?? r?.estado?.cdEstado ?? NaN
              );
              const estadoDsRaw =
                String(
                  r?.dsEstado ?? r?.estado?.dsEstado ?? ""
                )
                  .trim()
                  .toString() || undefined;
              const idFiestaRaw = getFiestaId(r);
              const idFiesta = sanitizeUuid(idFiestaRaw) || undefined;
              const compraId = getCompraId(r) || undefined;
              const dtInsert = getDtInsert(r) || undefined;

              return {
                idEntrada,
                idEvento,
                idFecha: idFecha || undefined,
                mdQR,
                tipoCd: Number.isFinite(tipoCd)
                  ? (tipoCd as number)
                  : undefined,
                tipoDs,
                precio: Number.isFinite(precio)
                  ? (precio as number)
                  : undefined,
                nroEntrada: Number.isFinite(nroEntradaRaw)
                  ? (nroEntradaRaw as number)
                  : undefined,
                estadoCd: Number.isFinite(estadoCdRaw)
                  ? (estadoCdRaw as number)
                  : undefined,
                estadoDs: estadoDsRaw,
                idFiesta,
                compraId,
                dtInsert,
              };
            }
          );

          const fiestaCandidate =
            mapped.find((e) => !!e.idFiesta)?.idFiesta ||
            (evt &&
            (evt as any).__raw &&
            ((evt as any).__raw.idFiesta ||
              (evt as any).__raw.fiestaId)
              ? sanitizeUuid(
                  (evt as any).__raw.idFiesta ||
                    (evt as any).__raw.fiestaId
                ) || undefined
              : undefined);

          let mappedWithFiesta: UiUserEntry[] = fiestaCandidate
            ? mapped.map((e) => ({
                ...e,
                idFiesta: e.idFiesta ?? fiestaCandidate,
              }))
            : mapped;

          try {
            const missing = mappedWithFiesta.filter(
              (e) => !e.idFiesta && e.idEvento
            );
            const uniqueEventIds = Array.from(
              new Set(missing.map((e) => String(e.idEvento)))
            );
            if (uniqueEventIds.length) {
              const evPairs = await Promise.all(
                uniqueEventIds.map(async (eid) => {
                  try {
                    const ev = await fetchEventById(eid);
                    const raw = (ev as any)?.__raw;
                    const f = sanitizeUuid(
                      raw?.idFiesta ||
                        raw?.fiestaId ||
                        raw?.id_fiesta ||
                        raw?.fiesta?.idFiesta
                    );
                    return [eid, f] as const;
                  } catch {
                    return [eid, null] as const;
                  }
                })
              );
              const mapEventToFiesta = new Map<string, string | null>(
                evPairs
              );
              mappedWithFiesta = mappedWithFiesta.map((e) => {
                if (
                  !e.idFiesta &&
                  e.idEvento &&
                  mapEventToFiesta.has(String(e.idEvento))
                ) {
                  const f = mapEventToFiesta.get(String(e.idEvento));
                  return { ...e, idFiesta: f ?? undefined };
                }
                return e;
              });
            }
          } catch {}

          const withQrImages: UiUserEntry[] = await Promise.all(
            mappedWithFiesta.map(async (e) => {
              try {
                const data = await mediaApi.getByEntidad(e.idEntrada);
                const list: any[] = Array.isArray(
                  (data as any)?.media
                )
                  ? (data as any).media
                  : [];
                const img = list.find(
                  (m) =>
                    m &&
                    typeof m.url === "string" &&
                    m.url.trim().length > 0 &&
                    !m?.mdVideo &&
                    !/youtube\.com|youtu\.be/i.test(m.url)
                );
                const mediaId =
                  img?.idMedia || img?.id || img?.IdMedia || undefined;
                const url = img?.url || "";
                return {
                  ...e,
                  qrImageUrl: url || undefined,
                  mediaId,
                };
              } catch {
                return e;
              }
            })
          );
          setEntries(withQrImages);
          try {
            console.log(
              "[TicketPurchasedScreen] Entradas (idEntrada, idFiesta, idMedia):",
              withQrImages.map((x) => ({
                idEntrada: x.idEntrada,
                idEvento: x.idEvento,
                idFiesta: x.idFiesta,
                idMedia: x.mediaId,
              }))
            );
            const fiestaIdLogRaw =
              withQrImages.find((e) => e.idFiesta)?.idFiesta ||
              (eventId ? String(eventId) : undefined);
            const fiestaIdLog = sanitizeUuid(fiestaIdLogRaw);
            if (fiestaIdLog)
              console.log(
                "[TicketPurchasedScreen] idFiesta (derivado,sanitizado):",
                fiestaIdLog
              );
          } catch {}
        } else {
          setEntries([]);
        }
      } catch (e) {
        setEventData(null);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, user, idCompra, estadoCd]);

  // Helper estado "controlada"
  const controlledMatch = useMemo(
    () => (s?: string) => {
      const t = (s || "").toLowerCase();
      return (
        t.includes("controlada") ||
        t.includes("controlado") ||
        t.includes("verificada") ||
        t.includes("escaneada") ||
        t.includes("canjeada")
      );
    },
    []
  );

  const allControlled = useMemo(
    () =>
      entries.length > 0 &&
      entries.every((e: any) => controlledMatch(e?.estadoDs)),
    [entries, controlledMatch]
  );

  const isPendingPayment = useMemo(
    () => (ds?: string, cd?: number) => {
      const t = (ds || "").toLowerCase();
      if (
        t.includes("pend") ||
        t.includes("reserva") ||
        t.includes("a confirmar") ||
        t.includes("sin pago") ||
        t.includes("no pago")
      ) {
        return true;
      }
      if (typeof cd === "number" && [0, -1].includes(cd)) return true;
      return false;
    },
    []
  );

  const allPendingForSelection = useMemo(() => {
    const selected = Array.isArray(entries)
      ? entries.filter((e) =>
          idCompra ? e.compraId === String(idCompra) : true
        )
      : [];
    if (selected.length === 0) return false;
    return selected.every((e) =>
      isPendingPayment(e?.estadoDs, e?.estadoCd)
    );
  }, [entries, idCompra, isPendingPayment]);

  const isCanceledEntry = useMemo(
    () => (ds?: string, cd?: number) => {
      const t = (ds || "").toLowerCase();
      if (t.includes("anul") || t.includes("cancel")) return true;
      if (typeof cd === "number" && [5].includes(cd)) return true;
      return false;
    },
    []
  );

  const allCanceledForSelection = useMemo(() => {
    const selected = Array.isArray(entries)
      ? entries.filter((e) =>
          idCompra ? e.compraId === String(idCompra) : true
        )
      : [];
    if (selected.length === 0) return false;
    return selected.every((e) =>
      isCanceledEntry(e?.estadoDs, e?.estadoCd)
    );
  }, [entries, idCompra, isCanceledEntry]);

  // Botón de arrepentimiento - lógica de apertura
  const handleRefundStart = () => {
    setRefundChecked(false);
    try {
      const relevant = Array.isArray(entries)
        ? entries.filter((e) =>
            idCompra ? e.compraId === String(idCompra) : true
          )
        : [];
      let dtInsertStr: string | undefined = undefined;
      for (const e of relevant) {
        if (e?.dtInsert && !dtInsertStr) dtInsertStr = e.dtInsert;
      }
      const toDate = (s?: string | null): Date | null => {
        if (!s) return null;
        const t = new Date(String(s));
        if (!isNaN(t.getTime())) return t;
        const m = String(s).match(
          /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/
        );
        if (m) {
          const d = m[1].padStart(2, "0");
          const mo = m[2].padStart(2, "0");
          const y = m[3];
          const hh = (m[4] ?? "12").padStart(2, "0");
          const mm = (m[5] ?? "00").padStart(2, "0");
          const iso = `${y}-${mo}-${d}T${hh}:${mm}:00Z`;
          const t2 = new Date(iso);
          return isNaN(t2.getTime()) ? null : t2;
        }
        return null;
      };
      const purchaseDate = toDate(dtInsertStr);
      const now = new Date();
      const msPerDay = 24 * 60 * 60 * 1000;

      // Detectar actualización del evento (dtUpdate) y aplicar ventana especial de 5 días
      try {
        const eventUpdateRaw =
          (eventData as any)?.dtUpdate ||
          (eventData as any)?.__raw?.dtUpdate ||
          (eventData as any)?.__raw?.dt_update;
        const eventUpdateDate = eventUpdateRaw ? toDate(eventUpdateRaw) : null;
        let hasUpdateOverride = false;
        if (
          eventUpdateDate &&
          purchaseDate &&
          purchaseDate.getTime() < eventUpdateDate.getTime()
        ) {
          const diffFromUpdate = now.getTime() - eventUpdateDate.getTime();
          if (diffFromUpdate >= 0 && diffFromUpdate <= 5 * msPerDay) {
            hasUpdateOverride = true;
          }
        }
        if (hasUpdateOverride) {
          setRefundInfoMessage(
            "Se detectó que el evento fue modificado después de tu compra. Tenés 5 días desde la última actualización para solicitar el reembolso."
          );
        } else {
          setRefundInfoMessage(null);
        }
        // Si aplica la excepción, saltamos validaciones básicas (10 días / 48hs)
        if (hasUpdateOverride) {
          setRefundBlockedReason(null);
          setShowRefund(true);
          return;
        }
      } catch {
        // en caso de error al evaluar la excepción, continuar con las reglas normales
        setRefundInfoMessage(null);
      }

      if (
        purchaseDate &&
        now.getTime() - purchaseDate.getTime() > 10 * msPerDay
      ) {
        setRefundBlockedReason(
          "No se puede cancelar la compra porque han pasado más de 10 días desde que se realizó."
        );
        setShowRefund(true);
        return;
      }

      if (eventData?.fechas && eventData.fechas.length) {
        const usedFechaIds = new Set(
          relevant.map((e) => e.idFecha).filter(Boolean) as string[]
        );
        const candidates = usedFechaIds.size
          ? eventData.fechas.filter((f) =>
              usedFechaIds.has(String(f.idFecha))
            )
          : eventData.fechas;
        const valid = candidates
          .map((f) => new Date(String(f.inicio)))
          .filter((d) => !isNaN(d.getTime()));
        if (valid.length) {
          valid.sort((a, b) => a.getTime() - b.getTime());
          const start = valid[0];
          if (start.getTime() - now.getTime() < 48 * 60 * 60 * 1000) {
            setRefundBlockedReason(
              "No se puede cancelar la compra porque el evento está a menos de 48hs de dar inicio."
            );
            setShowRefund(true);
            return;
          }
        }
      }

      setRefundBlockedReason(null);
      setShowRefund(true);
    } catch {
      setRefundBlockedReason(null);
      setShowRefund(true);
    }
  };

  // Confirmar reembolso
  const handleRefundConfirm = async () => {
    if (!refundChecked || refundSubmitting) return;
    const compraIdFinal =
      (idCompra && String(idCompra)) ||
      (entries.find((e) => e.compraId)?.compraId
        ? String(entries.find((e) => e.compraId)!.compraId)
        : null);
    if (!compraIdFinal) {
      Alert.alert(
        "Error",
        "No se encontró el identificador de la compra para solicitar el reembolso."
      );
      return;
    }

    try {
      setRefundSubmitting(true);
      try {
        console.log(
          "[Refund] solicitando reembolso para compraIdFinal=",
          compraIdFinal
        );
      } catch {}

      const related = entries.filter(
        (e) => String(e.compraId) === compraIdFinal
      );
      const amount = related.reduce(
        (acc, e) =>
          acc + (typeof e.precio === "number" ? e.precio : 0),
        0
      );

      let purchaseDateStr: string | undefined = undefined;
      for (const r of related) {
        if (r.dtInsert && !purchaseDateStr) purchaseDateStr = r.dtInsert;
      }

      const resp = await solicitarReembolso(compraIdFinal);
      if (!resp.ok) {
        Alert.alert(
          "Reembolso",
          resp.mensaje || "No se pudo solicitar el reembolso."
        );
        return;
      }

      setRefundAmount(amount);
      setShowRefund(false);
      setShowRefundSuccess(true);

      try {
        const toMail =
          (user as any)?.correo ||
          (user as any)?.email ||
          (user as any)?.username ||
          "";
        if (toMail) {
          const nombreUsuario =
            (user as any)?.nombre && (user as any)?.apellido
              ? `${(user as any).nombre} ${(user as any).apellido}`
              : (user as any)?.displayName ||
                (user as any)?.name ||
                (user as any)?.username ||
                "Usuario";

          const numeroOperacionMP =
            resp?.data?.numeroOperacionMP ||
            resp?.data?.idOperacionMP ||
            resp?.data?.mpOperationId ||
            "";

          let fechaCompraForEmail: Date | string =
            purchaseDateStr || new Date();
          try {
            if (purchaseDateStr) {
              const d = new Date(purchaseDateStr);
              if (!isNaN(d.getTime())) fechaCompraForEmail = d;
              else fechaCompraForEmail = purchaseDateStr;
            }
          } catch {}

          const { titulo, cuerpo } = buildCancellationEmailBody({
            nombreUsuario,
            nombreEvento: eventData?.title || "",
            importeReembolsado: amount,
            fechaCompra: fechaCompraForEmail,
            numeroOperacionMP,
          });

          await mailsApi.sendGenericEmail({
            to: toMail,
            titulo,
            cuerpo,
            botonUrl: "",
            botonTexto: "",
          });
          try {
            console.log(
              "[RefundEmail] enviado correo genérico de cancelación"
            );
          } catch {}
        } else {
          try {
            console.log("[RefundEmail] sin email destino en user");
          } catch {}
        }
      } catch (mailErr: any) {
        try {
          console.warn(
            "[RefundEmail] error al enviar correo de cancelación",
            mailErr?.message
          );
        } catch {}
      }
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.message || "Fallo al solicitar el reembolso."
      );
    } finally {
      setRefundSubmitting(false);
    }
  };

  // PDF

  const buildPurchasePdfHtml = (
    ev: EventItemWithExtras,
    images: {
      entry: UiUserEntry;
      dataUrl?: string;
      url?: string;
      text: string;
    }[],
    compraIdStr?: string
  ) => {
    const LOGO_BASE64 =
      "data:image/jpeg;base64,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";
    const dateHuman = formatDateEs(ev.date);
    const headerTitle =
      (user && (user as any).nombre)
        ? `${(user as any).nombre}, aquí tienes tus entradas QR`
        : "Aquí tienes tus entradas QR";
    const eventLink = (ev as any)?.url || null;
    const artistas = Array.isArray((ev as any)?.artistas)
      ? (ev as any).artistas
          .map(
            (a: any) =>
              a?.name || a?.nombre || a?.dsNombre
          )
          .filter(Boolean)
          .join(", ")
      : "";
    const address = [
      getText(ev.address),
      getText((ev as any)?.localidad),
      getText((ev as any)?.municipio),
      getText((ev as any)?.provincia),
    ]
      .filter(Boolean)
      .join(", ");
    const fechaHora = `${dateHuman}${
      ev.timeRange ? `, ${ev.timeRange}` : ""
    }`;

    const sections = images
      .map(({ entry, dataUrl, url, text }) => {
        const tipo = entry.tipoDs ?? (entry.tipoCd ?? "Entrada");
        const precio =
          typeof entry.precio === "number" &&
          !isNaN(entry.precio)
            ? `$${entry.precio.toLocaleString("es-AR")}`
            : "-";
        return `
        <div class="qr-section">
          <div class="qr-img">${
            dataUrl || url
              ? `<img src="${dataUrl || url}" alt="QR" />`
              : `<div class="qr-fallback">${text}</div>`
          }</div>
          <div class="qr-info"><b>Tipo:</b> ${tipo}<br/><b>Precio:</b> ${precio}</div>
        </div>
      `;
      })
      .join("");

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: A4; margin: 18mm; }
            body {
              margin:0; padding:0; font-family: Arial, Helvetica, 'Segoe UI', Roboto, sans-serif; background:#fff; color:#111827;
            }
            .watermark-overlay {
              position: fixed;
              top: 0; left: 0; width: 100vw; height: 100vh;
              z-index: 0;
              pointer-events: none;
              user-select: none;
            }
            .watermark-text {
              position: absolute;
              font-size: 48px;
              color: #ebebeb;
              font-weight: 700;
              opacity: 0.6;
              transform: rotate(-18deg);
              white-space: nowrap;
              pointer-events: none;
              user-select: none;
            }
            .wrap { max-width: 600px; margin: 0 auto; position: relative; z-index: 1; }
            .header {
              display:flex; align-items:center; justify-content:space-between;
              padding: 10px 0 12px; border-bottom: 2px solid #0F172A;
            }
            .header-title { font-weight: 700; font-size: 20px; color:#111; }
            .logo-ra { width: 54px; height: 54px; object-fit: contain; border-radius: 8px; }
            .event-link, .event-title-violet { color: #6C2BD7 !important; text-decoration: none; font-weight: bold; }
            .event-data { margin: 18px 0 10px; font-size: 15px; }
            .event-data-row { margin-bottom: 4px; display: flex; align-items: center; }
            .event-data-label { font-weight: bold; margin-right: 4px; }
            .qr-section { margin: 32px 0 0 0; text-align: center; }
            .qr-img img { width: 220px; height: 220px; max-width: 90vw; max-height: 220px; }
            .qr-info { margin-top: 10px; font-size: 16px; }
            hr { border: none; border-top: 1px solid #bbb; margin: 24px 0 0 0; }
          </style>
        </head>
        <body>
          <div class="watermark-overlay">
            <span class="watermark-text" style="top:6%; left:6%;">RaveApp</span>
            <span class="watermark-text" style="top:22%; left:28%;">RaveApp</span>
            <span class="watermark-text" style="top:38%; left:50%;">RaveApp</span>
            <span class="watermark-text" style="top:54%; left:72%;">RaveApp</span>
            <span class="watermark-text" style="top:12%; left:38%;">RaveApp</span>
            <span class="watermark-text" style="top:28%; left:60%;">RaveApp</span>
            <span class="watermark-text" style="top:44%; left:82%;">RaveApp</span>
            <span class="watermark-text" style="top:68%; left:10%;">RaveApp</span>
            <span class="watermark-text" style="top:80%; left:34%;">RaveApp</span>
            <span class="watermark-text" style="top:86%; left:58%;">RaveApp</span>
            <span class="watermark-text" style="top:72%; left:76%;">RaveApp</span>
            <span class="watermark-text" style="top:48%; left:18%;">RaveApp</span>
          </div>
          <div class="wrap">
            <div class="header">
              <div class="header-title">${headerTitle}</div>
              <img class="logo-ra" src="${LOGO_BASE64}" alt="RA" />
            </div>
            <div class="event-data">
              <div class="event-data-row"><span class="event-data-label">Evento:</span> ${
                eventLink
                  ? `<a class="event-link event-title-violet" href="${eventLink}">${ev.title}</a>`
                  : `<span class="event-title-violet">${ev.title}</span>`
              }</div>
              <div class="event-data-row"><span class="event-data-label">Fecha y hora:</span> ${fechaHora}</div>
              <div class="event-data-row"><span class="event-data-label">Dirección:</span> ${address}</div>
              ${
                artistas
                  ? `<div class="event-data-row"><span class="event-data-label">Artistas:</span> ${artistas}</div>`
                  : ""
              }
              ${
                compraIdStr
                  ? `<div class="event-data-row"><span class="event-data-label">Compra:</span> ${compraIdStr}</div>`
                  : ""
              }
            </div>
            <hr/>
            ${sections}
          </div>
        </body>
      </html>`;
  };

  const handleDownloadAll = async (
    qrRefs: React.MutableRefObject<Record<string, any>>
  ) => {
    if (!eventData || !entries.length) return;

    const qrImages: {
      entry: UiUserEntry;
      dataUrl?: string;
      url?: string;
      text: string;
    }[] = [];

    for (const e of entries) {
      const qrText =
        e.mdQR ||
        `Entrada:${e.idEntrada}|Evento:${eventData.id}|Fecha:${
          e.idFecha ?? ""
        }`;
      let dataUrl: string | undefined;
      const url = e.qrImageUrl;
      try {
        if (!url) {
          const ref = qrRefs.current[e.idEntrada];
          if (ref && typeof ref.toDataURL === "function") {
            // eslint-disable-next-line no-await-in-loop
            dataUrl = await new Promise<string>((resolve) =>
              ref.toDataURL((data: string) =>
                resolve(`data:image/png;base64,${data}`)
              )
            );
          }
        }
      } catch {}
      qrImages.push({ entry: e, dataUrl, url, text: qrText });
    }

    const html = buildPurchasePdfHtml(
      eventData,
      qrImages,
      String(idCompra || "")
    );

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Print.printAsync({ uri });
    } catch (err) {
      console.error("Error generando o mostrando PDF:", err);
    }
  };

  return {
    loading,
    eventData,
    ticketsCount,
    entries,
    addressDisplay,
    allControlled,
    allPendingForSelection,
    allCanceledForSelection,
    fiestaIdForReview,
    userReview,
    showReview,
    setShowReview,
    rating,
    setRating,
    comment,
    setComment,
    submitting,
    deleting,
    readOnlyReview,
    setReadOnlyReview,
    handleSubmitReview,
    showRefund,
    setShowRefund,
    refundChecked,
    setRefundChecked,
    refundBlockedReason,
    refundSubmitting,
    showRefundSuccess,
    setShowRefundSuccess,
    refundAmount,
    refundInfoMessage,
    handleRefundStart,
    handleRefundConfirm,
    handleDownloadAll,
    openMapsDirections,
    formatDateEs,
    formatTicketCode,
    isCanceledEntry,
  };
}

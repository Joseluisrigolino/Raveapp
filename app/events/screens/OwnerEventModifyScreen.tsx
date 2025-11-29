// Clean rewrite of screen to fix syntax and await errors
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import Header from '@/components/layout/HeaderComponent';
import Footer from '@/components/layout/FooterComponent';
import TitlePers from '@/components/common/TitleComponent';
import { COLORS, RADIUS } from '@/styles/globalStyles';

import { ApiGenero, fetchGenres, fetchEventById, updateEvent, updateEventExact } from '@/app/events/apis/eventApi';
import { mediaApi } from '@/app/apis/mediaApi';
import { mailsApi } from '@/app/apis/mailsApi';

type UpdateEventoRequest = {
  idEvento: string;
  idArtistas: string[];
  domicilio: {
    localidad: { nombre: string; codigo: string };
    municipio: { nombre: string; codigo: string };
    provincia: { nombre: string; codigo: string };
    direccion: string;
    latitud: number;
    longitud: number;
  };
  nombre: string;
  descripcion: string;
  genero: number[];
  isAfter: boolean;
  isLgbt: boolean;
  inicioEvento: string;
  finEvento: string;
  estado: number;
  fechas: {
    idFecha: string;
    inicio: string;
    fin: string;
    inicioVenta: string;
    finVenta: string;
    estado: number;
  }[];
  idFiesta: string | null;
  soundCloud: string;
};
import { fetchArtistsFromApi } from '@/app/artists/apis/artistApi';
import { Artist } from '@/app/artists/types/Artist';
import { fetchProvinces, fetchMunicipalities, fetchLocalities, fetchLocalitiesByProvince } from '@/app/apis/georefApi';
import { useAuth } from '@/app/auth/AuthContext';
import GenreSelector from '@/app/events/components/create/GenreSelector';
import ArtistSelector from '@/app/events/components/create/ArtistSelector';
import LocationSelector from '@/app/events/components/create/LocationSelector';
import DescriptionField from '@/app/events/components/create/DescriptionField';
import ScheduleSection from '@/app/events/components/create/ScheduleSection';
import TicketSection, { DayTickets as TicketDay } from '@/app/events/components/create/TicketSection';
import TicketConfigSection, { DaySaleConfig as SaleCfgDay } from '@/app/events/components/create/TicketConfigSection';
import MediaSection from '@/app/events/components/create/MediaSection';
import InputText from '@/components/common/inputText';
import { fetchEntradasFechaRaw, resolveTipoCodes } from '@/app/events/apis/entradaApi';

type ArtistLike = Artist & { __isNew?: boolean };

const toTitleCase = (s?: string | null) => {
  if (!s) return '';
  return String(s).trim().split(/\s+/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};
const createEmptyDayTickets = (): TicketDay => ({ genQty: '', genPrice: '', ebGenQty: '', ebGenPrice: '', vipQty: '', vipPrice: '', ebVipQty: '', ebVipPrice: '' });
const createEmptySchedule = (): { start: Date; end: Date } => ({ start: new Date(), end: new Date() });
const createEmptySaleConfig = (): SaleCfgDay => ({ saleStart: new Date(), sellUntil: new Date() });
// Igual que en CreateEvent: serialización local sin zona
const formatBackendIso = (d?: Date | null) => {
  if (!d) return undefined;
  const dt = new Date(d);
  if (!isFinite(dt.getTime())) return undefined;
  const pad = (n: number) => String(n).padStart(2, '0');
  const YYYY = dt.getFullYear();
  const MM = pad(dt.getMonth() + 1);
  const DD = pad(dt.getDate());
  const hh = pad(dt.getHours());
  const mm = pad(dt.getMinutes());
  const ss = pad(dt.getSeconds());
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}`;
};
// Compensación para venta: restar offset local para evitar corrimiento en backend
const formatBackendIsoVenta = (d?: Date | null) => {
  if (!d) return undefined;
  const dt = new Date(d);
  if (!isFinite(dt.getTime())) return undefined;
  const offsetMs = dt.getTimezoneOffset() * 60 * 1000;
  const adj = new Date(dt.getTime() - offsetMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  const YYYY = adj.getFullYear();
  const MM = pad(adj.getMonth() + 1);
  const DD = pad(adj.getDate());
  const hh = pad(adj.getHours());
  const mm = pad(adj.getMinutes());
  const ss = pad(adj.getSeconds());
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}`;
};

export default function OwnerEventModifyScreen() {
    // --- Actualizar evento ---
    async function handleUpdateEvento(updateData: any) {
      try {
        const { updateEvent } = await import("@/app/events/apis/eventApi");
        if (!updateData?.idEvento) throw new Error("Falta idEvento");
        await updateEvent(updateData.idEvento, updateData);
        Alert.alert("Éxito", "Evento actualizado correctamente.");
      } catch (e: any) {
        Alert.alert("Error actualizando evento", e?.message || "Error desconocido");
      }
    }
    // Ejemplo de uso (puedes llamarlo desde un botón o acción):
    // handleUpdateEvento({
    //   idEvento: "a08578df-cc82-11f0-b7c1-0200170026e8",
    //   nombre: "aa2",
    //   descripcion: "aa",
    //   genero: [1],
    //   domicilio: { ... },
    //   idArtistas: ["173f4079-1547-11f0-80c4-0200170026e8"],
    //   fechas: [ ... ],
    //   ...otrosCampos
    // })
  const { id } = useLocalSearchParams<{ id?: string }>();
  const eventId = (id ?? '').toString();
  const { user } = useAuth();
  const mustShowLogin = !user || (user as any)?.role === 'guest';
  const router = require('expo-router').useRouter();
  const ROUTES = require('@/routes').ROUTES;

  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  const [genres, setGenres] = useState<ApiGenero[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

  const [artistInput, setArtistInput] = useState('');
  const [selectedArtists, setSelectedArtists] = useState<ArtistLike[]>([]);
  const [allArtists, setAllArtists] = useState<Artist[]>([]);
  const [artistLoading, setArtistLoading] = useState(false);

  const [provinces, setProvinces] = useState<{ id: string; nombre: string }[]>([]);
  const [municipalities, setMunicipalities] = useState<{ id: string; nombre: string }[]>([]);
  const [localities, setLocalities] = useState<{ id: string; nombre: string }[]>([]);
  const [provinceId, setProvinceId] = useState('');
  const [provinceName, setProvinceName] = useState('');
  const [municipalityId, setMunicipalityId] = useState('');
  const [municipalityName, setMunicipalityName] = useState('');
  const [localityId, setLocalityId] = useState('');
  const [localityName, setLocalityName] = useState('');
  const [street, setStreet] = useState('');
  const [showProvinces, setShowProvinces] = useState(false);
  const [showMunicipalities, setShowMunicipalities] = useState(false);
  const [showLocalities, setShowLocalities] = useState(false);
  const [isAfter, setIsAfter] = useState(false);
  const [isLGBT, setIsLGBT] = useState(false);

  const [daySchedules, setDaySchedules] = useState<{ start: Date; end: Date }[]>([createEmptySchedule()]);
  const [remoteFechaIds, setRemoteFechaIds] = useState<string[]>([]);
  const [daysTickets, setDaysTickets] = useState<TicketDay[]>([createEmptyDayTickets()]);
  const [daySaleConfigs, setDaySaleConfigs] = useState<SaleCfgDay[]>([createEmptySaleConfig()]);

  const [photoFile, setPhotoFile] = useState<any>(null);
  const [idEntidadMedia, setIdEntidadMedia] = useState<string | null>(null);
  const [videoLink, setVideoLink] = useState('');
  const [musicLink, setMusicLink] = useState('');

  const [saving, setSaving] = useState(false);

  // Carga inicial del evento y entradas
  const [originalEvent, setOriginalEvent] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ev = await fetchEventById(eventId);
        if (!mounted) return;
        setOriginalEvent(ev);
  // EventItemWithExtras usa 'title' y 'description'
  setEventName(ev.title || '');
  setEventDescription(ev.description || '');
        setSelectedGenres(Array.isArray(ev.genero) ? ev.genero : []);

        const fechas = Array.isArray(ev.fechas) ? ev.fechas.slice(0, 3) : [];
        const schedules = fechas.map(f => ({ start: f.inicio ? new Date(f.inicio) : new Date(), end: f.fin ? new Date(f.fin) : new Date() }));
        setDaySchedules(schedules.length ? schedules : [createEmptySchedule()]);
        setRemoteFechaIds(fechas.map(f => String(f.idFecha || '')));
        setDaysTickets(Array.from({ length: fechas.length || 1 }, createEmptyDayTickets));
        setDaySaleConfigs(Array.from({ length: fechas.length || 1 }, createEmptySaleConfig));

        const artistasFromApi: ArtistLike[] = Array.isArray(ev.artistas)
          ? ev.artistas.map((a: any) => ({
              idArtista: a?.idArtista ?? a?.id ?? '',
              name: toTitleCase(a?.nombre ?? a?.name ?? ''),
              image: a?.imagen ?? a?.image ?? '',
              description: a?.bio ?? a?.description ?? '',
              creationDate: a?.dtAlta ?? a?.creationDate ?? '',
              isActivo: a?.isActivo === undefined ? true : Boolean(a.isActivo),
              instagramURL: a?.socials?.mdInstagram ?? a?.instagramURL ?? '',
              spotifyURL: a?.socials?.mdSpotify ?? a?.spotifyURL ?? '',
              soundcloudURL: a?.socials?.mdSoundcloud ?? a?.soundcloudURL ?? '',
              likes: Number(a?.likes) || 0,
              likedByIds: Array.isArray(a?.likedByIds) ? a.likedByIds : [],
              likedByImages: Array.isArray(a?.likedByImages) ? a.likedByImages : [],
            }))
          : [];
        setSelectedArtists(artistasFromApi);

        // Domicilio plano/anidado
        const dom: any = ev.domicilio || {};
        const provObj = dom.provincia && typeof dom.provincia === 'object' ? dom.provincia : null;
        const muniObj = dom.municipio && typeof dom.municipio === 'object' ? dom.municipio : null;
        const locObj  = dom.localidad && typeof dom.localidad === 'object' ? dom.localidad : null;
        setProvinceId(dom.provinciaId || provObj?.codigo || provObj?.id || '');
        setProvinceName(provObj?.nombre || (typeof dom.provincia === 'string' ? dom.provincia : ''));
        setMunicipalityId(dom.municipioId || muniObj?.codigo || muniObj?.id || '');
        setMunicipalityName(muniObj?.nombre || (typeof dom.municipio === 'string' ? dom.municipio : ''));
        setLocalityId(dom.localidadId || locObj?.codigo || locObj?.id || '');
        setLocalityName(locObj?.nombre || (typeof dom.localidad === 'string' ? dom.localidad : ''));
        setStreet(dom.direccion || '');
        setIsAfter(Boolean(ev.isAfter));
  setIsLGBT(Boolean(ev.isLGBT));

        setPhotoFile(ev.imageUrl || null);
        // Si el evento tiene idEntidadMedia, lo guardamos para el update
        if (ev?.__raw?.idEntidadMedia) setIdEntidadMedia(ev.__raw.idEntidadMedia);
        setVideoLink((ev as any).video || '');
        setMusicLink((ev as any).musica || (ev as any).soundCloud || '');

        try {
          const tipoCodes = await resolveTipoCodes();
          const fechaIds = fechas.map(f => String(f.idFecha));
          const entradasPorFecha = await Promise.all(
            fechaIds.map(async fid => {
              try {
                const raw = await fetchEntradasFechaRaw(fid);
                const tk: TicketDay = createEmptyDayTickets();
                let saleStart: Date | undefined; let sellUntil: Date | undefined;
                for (const it of raw) {
                  const cd = Number(it?.tipo?.cdTipo ?? -1);
                  const cantidad = it?.cantidad ?? 0;
                  const precio = it?.precio ?? 0;
                  if (!saleStart && it?.fecha?.inicioVenta) { const d = new Date(it.fecha.inicioVenta); if (isFinite(d.getTime())) saleStart = d; }
                  if (!sellUntil && it?.fecha?.finVenta) { const d = new Date(it.fecha.finVenta); if (isFinite(d.getTime())) sellUntil = d; }
                  if (cd === tipoCodes.general) { tk.genQty = String(cantidad); tk.genPrice = String(precio); }
                  else if (cd === tipoCodes.earlyGeneral) { tk.ebGenQty = String(cantidad); tk.ebGenPrice = String(precio); }
                  else if (cd === tipoCodes.vip) { tk.vipQty = String(cantidad); tk.vipPrice = String(precio); }
                  else if (cd === tipoCodes.earlyVip) { tk.ebVipQty = String(cantidad); tk.ebVipPrice = String(precio); }
                }
                return { tk, saleCfg: { saleStart: saleStart ?? new Date(), sellUntil: sellUntil ?? new Date() } as SaleCfgDay };
              } catch {
                return { tk: createEmptyDayTickets(), saleCfg: createEmptySaleConfig() };
              }
            })
          );
          if (mounted) { setDaysTickets(entradasPorFecha.map(x => x.tk)); setDaySaleConfigs(entradasPorFecha.map(x => x.saleCfg)); }
        } catch (e) { console.warn('[ModifyEvent] entradas', e); }
      } catch (e: any) {
        if (mounted) setInitialError(e?.message || 'Error al cargar');
      } finally { if (mounted) setInitialLoading(false); }
    })();
    return () => { mounted = false; };
  }, [eventId]);

  // Complementos: géneros/artistas y provincias
  useEffect(() => { (async () => { try { const gs = await fetchGenres(); setGenres(Array.isArray(gs) ? gs : []); } catch {} })(); }, []);
  useEffect(() => { (async () => { try { const provs = await fetchProvinces(); setProvinces(provs); } catch {} })(); }, []);
  useEffect(() => { (async () => { try { setArtistLoading(true); const arts = await fetchArtistsFromApi(); setAllArtists(Array.isArray(arts) ? arts : []); } catch {} finally { setArtistLoading(false); } })(); }, []);

  const artistSuggestions = useMemo(() => {
    const q = artistInput.trim().toLowerCase();
    if (!q) return [] as Artist[];
    return allArtists.filter(a => a.name.toLowerCase().includes(q)).slice(0, 10);
  }, [artistInput, allArtists]);

  const toggleGenre = useCallback((id: number) => {
    setSelectedGenres(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);
  const onSelectSuggestion = useCallback((a: Artist) => {
    const name = toTitleCase(a.name);
    setSelectedArtists(prev => prev.find(x => x.name === name) ? prev : [...prev, { ...a, name } as any]);
    setArtistInput('');
  }, []);
  const onAddManual = useCallback((name: string) => {
    const clean = toTitleCase(name); if (!clean) return;
    setSelectedArtists(prev => prev.find(x => x.name === clean) ? prev : [...prev, { name: clean, __isNew: true } as any]);
    setArtistInput('');
  }, []);
  const onRemoveArtist = useCallback((name: string) => { setSelectedArtists(prev => prev.filter(x => x.name !== name)); }, []);

  const handleSelectProvince = useCallback(async (id: string, name: string) => {
    setProvinceId(id); setProvinceName(name); setShowProvinces(false);
    setMunicipalityId(''); setMunicipalityName(''); setLocalityId(''); setLocalityName('');
    try { const list = await fetchMunicipalities(id); setMunicipalities(list); } catch {}
    try { const locs = await fetchLocalitiesByProvince(id); setLocalities(locs); } catch {}
  }, []);
  const handleSelectMunicipality = useCallback(async (id: string, name: string) => {
    setMunicipalityId(id); setMunicipalityName(name); setShowMunicipalities(false);
    try { const locs = await fetchLocalities(provinceId, id); setLocalities(locs); } catch {}
  }, [provinceId]);
  const handleSelectLocality = useCallback((id: string, name: string) => { setLocalityId(id); setLocalityName(name); setShowLocalities(false); }, []);

  const setSchedule = useCallback((index: number, key: 'start' | 'end', val: Date) => { setDaySchedules(prev => prev.map((d,i) => i === index ? { ...d, [key]: val } : d)); }, []);
  const setTicket = useCallback((index: number, key: keyof TicketDay, val: string) => { setDaysTickets(prev => prev.map((d,i) => i === index ? { ...d, [key]: val } : d)); }, []);
  const setSaleCfg = useCallback((index: number, key: keyof SaleCfgDay, val: Date) => { setDaySaleConfigs(prev => prev.map((d,i) => i === index ? { ...d, [key]: val } : d)); }, []);
  const totalPerDay = useCallback((d: TicketDay) => { const a = parseInt(d.genQty || '0', 10) || 0; const b = parseInt(d.vipQty || '0', 10) || 0; return a + b; }, []);

  const onSubmit = useCallback(async () => {
    if (!eventName.trim()) { Alert.alert('Faltan datos', 'Ingresá el nombre del evento.'); return; }
    let payload: UpdateEventoRequest & { idEntidadMedia?: string };
    try {
      setSaving(true);
      let newIdEntidadMedia = idEntidadMedia;
      let newImageUrl = null;
      // Si hay una nueva imagen seleccionada (photoFile es un objeto con uri local), la subimos
      if (photoFile && typeof photoFile === 'object' && photoFile.uri && !photoFile.url) {
        try {
          const uploadRes = await mediaApi.upload(eventId, photoFile, undefined, { compress: true, maxBytes: 2 * 1024 * 1024 });
          // El backend debería devolver el nuevo idEntidadMedia
          if (uploadRes?.idEntidadMedia && typeof uploadRes.idEntidadMedia === 'string') {
            newIdEntidadMedia = uploadRes.idEntidadMedia;
            setIdEntidadMedia(newIdEntidadMedia);
            // Obtener la nueva URL de imagen subida
            try {
              if (newIdEntidadMedia) {
                const url = await mediaApi.getFirstImage(newIdEntidadMedia);
                if (url) {
                  newImageUrl = url;
                  setPhotoFile({ uri: url });
                }
              }
            } catch {}
          }
        } catch (imgErr) {
          console.error('[UPDATE EVENT] Error subiendo imagen:', imgErr);
          Alert.alert('Error', 'No se pudo subir la imagen.');
          setSaving(false);
          return;
        }
      }
      // Construcción del payload según UpdateEventoRequest
      const idArtistas = selectedArtists.map(a => (a as any).idArtista).filter(Boolean) as string[];
      const domicilio: UpdateEventoRequest['domicilio'] = {
        localidad: { nombre: localityName || '', codigo: localityId || '' },
        municipio: { nombre: municipalityName || '', codigo: municipalityId || '' },
        provincia: { nombre: provinceName || '', codigo: provinceId || '' },
        direccion: street || '',
        latitud: 0,
        longitud: 0
      };
      // Mantener los estados originales de fechas y evento
        const fechas: UpdateEventoRequest['fechas'] = daySchedules.map((d, i) => {
          const origFecha = originalEvent?.fechas?.[i] || {};
          return {
            idFecha: remoteFechaIds[i] || origFecha.idFecha || '',
            inicio: formatBackendIso(d.start) || origFecha.inicio || '',
            fin: formatBackendIso(d.end) || origFecha.fin || '',
            inicioVenta: formatBackendIsoVenta(daySaleConfigs[i]?.saleStart) || origFecha.inicioVenta || '',
            finVenta: formatBackendIsoVenta(daySaleConfigs[i]?.sellUntil) || origFecha.finVenta || '',
            estado: origFecha.estado ?? 0,
            cdEstado: origFecha.cdEstado ?? 0
          };
        });
        payload = {
          idEvento: eventId,
          idArtistas,
          domicilio,
          nombre: eventName,
          descripcion: eventDescription,
          genero: selectedGenres,
          isAfter,
          isLgbt: isLGBT,
          inicioEvento: formatBackendIso(daySchedules[0]?.start) || (originalEvent?.inicioEvento ?? ''),
          finEvento: formatBackendIso(daySchedules[0]?.end) || (originalEvent?.finEvento ?? ''),
          estado: originalEvent?.estado ?? 0,
          cdEstado: originalEvent?.cdEstado ?? 0,
          fechas,
          idFiesta: null,
          soundCloud: ''
        };
      if (newIdEntidadMedia) payload.idEntidadMedia = newIdEntidadMedia;
      // LOG DETALLADO DEL PAYLOAD Y ENDPOINT
      console.log('[UPDATE EVENT] Endpoint: /v1/Evento/UpdateEvento');
      console.log('[UPDATE EVENT] Payload:', JSON.stringify(payload, null, 2));
      await updateEventExact(payload);
      // Si se subió imagen y se obtuvo nueva URL, refrescar el preview
      if (newImageUrl) {
        setPhotoFile({ uri: newImageUrl });
      }
      // Enviar mail masivo de modificación
      try {
        await mailsApi.sendMassiveEventUpdateEmail({ idEvento: eventId, nombreEvento: eventName });
      } catch (mailErr) {
        console.warn('No se pudo enviar el mail masivo de modificación:', mailErr);
      }
      Alert.alert('Listo', 'Cambios guardados correctamente.');
      // Redirigir a la pantalla de administración de eventos
      setTimeout(() => {
        router.replace(ROUTES.OWNER.MANAGE_EVENTS);
      }, 300);
    } catch (e: any) {
      // Mostrar error enriquecido si la API adjuntó status/data
      try {
        const status = (e as any)?.status || (e as any)?.response?.status;
        const data = (e as any)?.data || (e as any)?.response?.data;
        let msg = e?.message || 'No se pudo guardar el evento.';
        if (status) msg = `Error ${status}: ${msg}`;
        const detail = data && (data?.message || data?.error || (typeof data === 'string' ? data : null));
        if (detail) msg = `${msg}\n\nDetalle: ${String(detail)}`;
        Alert.alert('Error', msg);
        // LOG DEL ERROR Y PAYLOAD
        console.error('[UPDATE EVENT ERROR]', msg);
        console.error('[UPDATE EVENT ERROR] Payload:', JSON.stringify(payload, null, 2));
      } catch (inner) {
        Alert.alert('Error', e?.message || 'No se pudo guardar el evento.');
        console.error('[UPDATE EVENT ERROR]', e?.message || 'No se pudo guardar el evento.');
      }
    }
    finally { setSaving(false); }
  }, [eventName, eventDescription, selectedGenres, provinceName, provinceId, municipalityName, municipalityId, localityName, localityId, street, isAfter, isLGBT, daySchedules, daySaleConfigs, remoteFechaIds, selectedArtists, eventId, idEntidadMedia, photoFile, originalEvent]);

  const selectedArtistsUi = useMemo(() => selectedArtists.map(a => ({ ...a })), [selectedArtists]);

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
          <ActivityIndicator />
        </View>
        <Footer />
      </SafeAreaView>
    );
  }
  if (initialError) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={{ padding:16 }}>
          <Text style={{ color: COLORS.negative }}>Error: {initialError}</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={{ padding:16, paddingBottom:40 }}>
  <TitlePers text="Modificar Evento" />
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Estás editando un evento existente. Las entradas se muestran solo para referencia.</Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningText}>* Alaracion: Si realizas alguna modificacion en los datos del evento, se le enviara un mail automaticamente a los usuarios que hayan adquirido una entrada, para notificarles de los cambios, con la opcion de devolucion/reembolso de la entrada, siempre y cuando lo soliciten dentro de los 5 dias corridos.</Text>
        </View>
        <InputText
          label="Nombre del evento"
          value={eventName}
          isEditing={true}
          onBeginEdit={() => {}}
          onChangeText={setEventName}
          placeholder="Nombre"
          labelStyle={{ width:'100%', marginLeft:2 }}
          inputStyle={{ width:'100%' }}
        />

  <GenreSelector genres={genres} selectedGenres={selectedGenres} onToggle={toggleGenre} />

  <DescriptionField value={eventDescription} onChange={setEventDescription} />

        <ArtistSelector
          artistInput={artistInput}
          setArtistInput={setArtistInput}
          artistLoading={artistLoading}
          suggestions={artistSuggestions}
          onSelectSuggestion={onSelectSuggestion}
          onAddManual={onAddManual}
          selectedArtists={selectedArtistsUi as any}
          onRemoveArtist={onRemoveArtist}
        />

        <LocationSelector
          provinces={provinces}
          municipalities={municipalities}
          localities={localities}
          provinceId={provinceId}
          provinceName={provinceName}
          municipalityId={municipalityId}
          municipalityName={municipalityName}
          localityId={localityId}
          localityName={localityName}
          street={street}
          setStreet={setStreet}
          isAfter={isAfter}
          setIsAfter={setIsAfter}
          isLGBT={isLGBT}
          setIsLGBT={setIsLGBT}
          showProvinces={showProvinces}
          setShowProvinces={setShowProvinces}
          showMunicipalities={showMunicipalities}
          setShowMunicipalities={setShowMunicipalities}
          showLocalities={showLocalities}
          setShowLocalities={setShowLocalities}
          handleSelectProvince={handleSelectProvince}
          handleSelectMunicipality={handleSelectMunicipality}
          handleSelectLocality={handleSelectLocality}
          allowLocalitiesWithoutMunicipality={true}
        />

  <ScheduleSection daySchedules={daySchedules} setSchedule={setSchedule} />

  

        <View style={{ opacity:0.55 }} pointerEvents="none">
          <TicketSection daysTickets={daysTickets} setTicket={setTicket} totalPerDay={totalPerDay} />
        </View>
        <Text style={styles.hintMuted}>Las entradas no pueden modificarse desde esta pantalla.</Text>

        <TicketConfigSection daySaleConfigs={daySaleConfigs} setSaleCfg={setSaleCfg} />

        <MediaSection
          photoFile={photoFile && photoFile.uri ? photoFile : (typeof photoFile === 'string' ? { uri: photoFile } : photoFile)}
          onChangePhoto={img => {
            setPhotoFile(img);
          }}
          videoLink={videoLink}
          musicLink={musicLink}
          onChangeVideo={setVideoLink}
          onChangeMusic={setMusicLink}
          maxImageBytes={2 * 1024 * 1024}
        />

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity:0.7 }]} onPress={onSubmit} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Guardando…' : 'Guardar cambios'}</Text>
        </TouchableOpacity>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: COLORS.backgroundLight },
  infoBox: { width:'100%', backgroundColor:'#EEF6FF', borderWidth:1, borderColor:'#B3D4FF', borderRadius:RADIUS.card, padding:14, marginBottom:20 },
  infoText: { fontSize:14, lineHeight:20, color: COLORS.textPrimary },
  saveBtn: { height:56, borderRadius:16, backgroundColor: COLORS.textPrimary, alignItems:'center', justifyContent:'center', marginBottom:24 },
  saveBtnText: { color:'#fff', fontWeight:'700' },
  hintMuted: { fontSize:12, color:'#6B7280', marginTop:6, marginBottom:10 },
  warningBox: { width: '100%', backgroundColor: '#FFF1F1', borderWidth: 1, borderColor: '#FFD6D6', borderRadius: RADIUS.card, padding: 12, marginBottom: 14 },
  warningText: { color: '#7A1F1F', fontSize: 13, lineHeight: 18 },
});

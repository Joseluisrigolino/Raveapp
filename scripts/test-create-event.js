const axios = require('axios');

const API_BASE_URL = 'https://api.raveapp.com.ar';
const api = axios.create({ baseURL: API_BASE_URL, timeout: 30000 });
const ARGS = process.argv.slice(2);
const KEEP = ARGS.includes('--keep');
const NO_UPDATE = ARGS.includes('--no-update');

async function login() {
  const credentials = { usuario: 'raveapp', pass: 'RaveAppApi367..' };
  const resp = await api.post('/v1/Security/Login', credentials, {
    headers: { 'Content-Type': 'application/json', accept: '*/*' },
  });
  return resp.data.token;
}

function pad(n) { return String(n).padStart(2, '0'); }
function formatBackendIso(d) {
  if (!d) return undefined;
  const dt = new Date(d);
  const YYYY = dt.getFullYear();
  const MM = pad(dt.getMonth() + 1);
  const DD = pad(dt.getDate());
  const hh = pad(dt.getHours());
  const mm = pad(dt.getMinutes());
  const ss = pad(dt.getSeconds());
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}`;
}

async function run() {
  const token = await login();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const now = new Date();
  const start = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // +5 days
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2h
  const saleStart = new Date(start.getTime() - 3 * 24 * 60 * 60 * 1000); // -3 days
  const saleEnd = new Date(start.getTime() - 1 * 24 * 60 * 60 * 1000); // -1 day

  const body = {
    nombre: `Test Fecha Mapping ${formatBackendIso(now)}`,
    descripcion: 'Debug test (auto-cleanup)',
    domicilio: {
      direccion: 'Test addr',
      latitud: 0,
      longitud: 0,
      provincia: { codigo: '02', nombre: 'Ciudad Autónoma de Buenos Aires' },
      municipio: { codigo: '02', nombre: 'Ciudad Autónoma de Buenos Aires' },
      localidad: { codigo: '0208401002', nombre: 'Saavedra' },
    },
    estado: 0,
    fechas: [
      {
        inicio: formatBackendIso(start),
        fin: formatBackendIso(end),
        inicioVenta: formatBackendIso(saleStart),
        finVenta: formatBackendIso(saleEnd),
        estado: 0,
      },
    ],
    // Duplicate top-level for server variants
    inicioEvento: formatBackendIso(start),
    finEvento: formatBackendIso(end),
    genero: [0],
    idArtistas: [],
    idFiesta: null,
    idUsuario: 'de2c459e-9cc8-11f0-b7c1-0200170026e8',
    inicioVenta: formatBackendIso(saleStart),
    finVenta: formatBackendIso(saleEnd),
    isAfter: false,
    isLgbt: false,
    soundCloud: '',
  };

  // Add normalization like app does
  const normalized = { ...body };
  normalized.fechas = normalized.fechas.map((f) => ({
    ...f,
    Inicio: f.inicio,
    Fin: f.fin,
    InicioVenta: f.inicioVenta,
    FinVenta: f.finVenta,
    fechaInicio: f.inicio,
    fechaFin: f.fin,
    fechaInicioVenta: f.inicioVenta,
    fechaFinVenta: f.finVenta,
  }));
  normalized.Fechas = normalized.fechas;
  normalized.InicioEvento = normalized.inicioEvento;
  normalized.FinEvento = normalized.finEvento;

  let id = null;
  // Wrap rest in try/finally so we always attempt cleanup
  try {
    const createResp = await api.post('/v1/Evento/CrearEvento', normalized, { headers });
    const createData = createResp.data;
    id = (createData && (createData.idEvento || createData.IdEvento || (createData.evento && (createData.evento.idEvento || createData.evento.IdEvento))))
      || (typeof createData === 'string' ? createData : null);
    console.log('[TEST] Created idEvento =', id, 'raw:', createData);

    if (!id) throw new Error('CreateEvent did not return idEvento');

    // Fetch event back (try multiple endpoints with small polling)
    async function fetchEventByIdMulti() {
      const attempts = [
        () => api.get('/v1/Evento/GetEvento', { params: { idEvento: id }, headers }),
        () => api.get('/v1/Evento/GetEvento', { params: { id }, headers }),
        () => api.get(`/v1/Evento/GetEvento/${encodeURIComponent(id)}`, { headers }),
      ];
      let lastErr;
      for (const fn of attempts) {
        try {
          const resp = await fn();
          return resp.data?.evento || resp.data;
        } catch (e) {
          lastErr = e;
          continue;
        }
      }
      throw lastErr || new Error('All attempts failed');
    }
    async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

    // Also, provide a fallback: scan events by estados and find by id
    async function fetchEventFromEstados() {
      const estados = [0,1,2,3,4,5,6];
      for (const st of estados) {
        try {
          const resp = await api.get('/v1/Evento/GetEventos', { params: { Estado: st }, headers });
          const arr = Array.isArray(resp.data?.eventos) ? resp.data.eventos : [];
          const found = arr.find((e) => String(e?.idEvento || e?.id).toLowerCase() === String(id).toLowerCase());
          if (found) return found;
        } catch {}
      }
      return null;
    }

    let evt = null;
    for (let i = 0; i < 8; i++) {
      try {
        evt = await fetchEventByIdMulti();
        if (evt) break;
      } catch {}
      // try estados listing as fallback
      try {
        evt = await fetchEventFromEstados();
        if (evt) break;
      } catch {}
      await sleep(1500);
    }
    if (!evt) throw new Error('Could not retrieve created event after retries');
    let fechas = Array.isArray(evt?.fechas) ? evt.fechas : [];
    console.log('[TEST] Fechas returned (before update):', fechas);

    // If inicioVenta is default/missing, patch via UpdateEvento (unless disabled)
    const needsPatch = !NO_UPDATE && fechas.some((f) => {
      const y = f?.inicioVenta ? new Date(f.inicioVenta).getUTCFullYear() : 0;
      return !f?.inicioVenta || y <= 1;
    });
    if (needsPatch) {
      const fechasUpd = fechas.map((f) => {
        const inicio = f?.inicio;
        const fin = f?.fin;
        const inicioVenta = formatBackendIso(saleStart);
        const finVenta = formatBackendIso(saleEnd);
        const idFecha = f?.idFecha;
        return {
          idFecha,
          inicio, fin, inicioVenta, finVenta, estado: 0,
          Inicio: inicio,
          Fin: fin,
          InicioVenta: inicioVenta,
          FinVenta: finVenta,
          fechaInicio: inicio,
          FechaInicio: inicio,
          fechaFin: fin,
          FechaFin: fin,
          fechaInicioVenta: inicioVenta,
          FechaInicioVenta: inicioVenta,
          fechaFinVenta: finVenta,
          FechaFinVenta: finVenta,
        };
      });

      // Build a full body based on the fetched event (to satisfy required fields)
      const domicilio = evt?.domicilio || body.domicilio;
      const genero = Array.isArray(evt?.genero)
        ? evt.genero
        : (typeof evt?.genero === 'number' ? [evt.genero] : (body.genero || []));
      const idArtistas = Array.isArray(evt?.artistas)
        ? evt.artistas.map((a) => a?.idArtista || a?.id).filter(Boolean)
        : [];
      const inicioEvento = (evt?.fechas && evt.fechas[0]?.inicio) || evt?.inicioEvento || body.inicioEvento;
      const finEvento = (evt?.fechas && evt.fechas[0]?.fin) || evt?.finEvento || body.finEvento;
      const estado = typeof evt?.estado === 'number' ? evt.estado : 0;
      const updBody = {
        idEvento: id,
        nombre: evt?.nombre || evt?.titulo || body.nombre || 'Test Fecha Mapping',
        descripcion: evt?.descripcion || body.descripcion || '',
        genero,
        domicilio,
        idArtistas,
        isAfter: Boolean(evt?.isAfter),
        isLgbt: Boolean(evt?.isLgbt || evt?.isLGBT),
        inicioEvento,
        finEvento,
        estado,
        fechas: fechasUpd,
        Fechas: fechasUpd,
        idFiesta: evt?.idFiesta || null,
        soundCloud: evt?.soundCloud || evt?.musica || '',
      };
      try {
        await api.put('/v1/Evento/UpdateEvento', updBody, { headers: { ...headers, 'Content-Type': 'application/json' } });
        // refetch with polling and estados fallback
        let refreshedEvt = null;
        for (let i = 0; i < 6; i++) {
          try {
            refreshedEvt = await fetchEventByIdMulti();
            if (!refreshedEvt) throw new Error('No evt');
            break;
          } catch {}
          try {
            refreshedEvt = await (async () => {
              const estados = [0,1,2,3,4,5,6];
              for (const st of estados) {
                try {
                  const resp = await api.get('/v1/Evento/GetEventos', { params: { Estado: st }, headers });
                  const arr = Array.isArray(resp.data?.eventos) ? resp.data.eventos : [];
                  const found = arr.find((e) => String(e?.idEvento || e?.id).toLowerCase() === String(id).toLowerCase());
                  if (found) return found;
                } catch {}
              }
              return null;
            })();
            if (refreshedEvt) break;
          } catch {}
          await sleep(1000);
        }
        if (refreshedEvt) {
          fechas = Array.isArray(refreshedEvt?.fechas) ? refreshedEvt.fechas : [];
          console.log('[TEST] Fechas returned (after update):', fechas);
        } else {
          console.warn('[TEST] Could not refetch event after update');
        }
      } catch (e) {
        console.warn('[TEST] UpdateEvento failed:', e?.response?.status, e?.response?.data || e?.message);
      }
    }
  } finally {
    if (id && !KEEP) {
      try {
        await api.delete('/v1/Evento/DeleteEvento', { params: { id }, headers });
        console.log('[TEST] Cleanup done');
      } catch (e) {
        console.warn('[TEST] Cleanup failed:', e?.response?.status, e?.response?.data || e?.message || e);
      }
    } else if (id && KEEP) {
      console.log('[TEST] Keeping event alive. idEvento =', id);
    }
  }
}

run().catch((e) => {
  console.error('TEST FAILED', e?.response?.status, e?.response?.data || e);
  process.exit(1);
});

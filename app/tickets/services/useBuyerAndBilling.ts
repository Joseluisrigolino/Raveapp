// app/tickets/services/buy/useBuyerAndBilling.ts
import { useCallback, useEffect, useState } from "react";
import {
  fetchProvinces,
  fetchMunicipalities,
  fetchLocalities,
  fetchLocalitiesByName,
  fetchLocalitiesByProvince,
} from "@/app/apis/georefApi";
import {
  getUsuarioById,
  updateUsuario,
} from "@/app/auth/userApi";
import { Alert } from "react-native";
import { BuyerInfo, BillingAddress } from "@/app/tickets/types/BuyProps";

type Params = {
  user: any;
};

export function useBuyerAndBilling({ user }: Params) {
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    firstName: "",
    lastName: "",
    idType: "DNI",
    idNumber: "",
    email: "",
    phone: "",
    birthDate: "",
  });

  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    direccion: "",
    localidad: "",
    municipio: "",
    provincia: "",
  });

  const [provinces, setProvinces] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [municipalities, setMunicipalities] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [localities, setLocalities] = useState<
    { id: string; nombre: string }[]
  >([]);

  const [provinceId, setProvinceId] = useState("");
  const [municipalityId, setMunicipalityId] = useState("");
  const [localityId, setLocalityId] = useState("");

  const [showProvinces, setShowProvinces] = useState(false);
  const [showMunicipalities, setShowMunicipalities] = useState(false);
  const [showLocalities, setShowLocalities] = useState(false);

  // Prefill desde perfil
  useEffect(() => {
    (async () => {
      try {
        const uid: string | null =
          user?.id ?? user?.idUsuario ?? null;
        if (!uid) return;

        const perfil = await getUsuarioById(String(uid)).catch(
          () => null
        );
        if (!perfil) return;

        let birth = "";
        try {
          if (perfil.dtNacimiento) {
            const d = new Date(perfil.dtNacimiento);
            if (isFinite(d.getTime())) {
              birth = d.toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });
            }
          }
        } catch {}

        setBuyerInfo((prev) => ({
          ...prev,
          firstName: perfil.nombre || "",
          lastName: perfil.apellido || "",
          idType: prev.idType || "DNI",
          idNumber: perfil.dni || "",
          email: perfil.correo || "",
          phone: perfil.telefono || "",
          birthDate: birth,
        }));

        const dom = perfil.domicilio || {};
        setBillingAddress({
          direccion: dom?.direccion || "",
          localidad: dom?.localidad?.nombre || "",
          municipio: dom?.municipio?.nombre || "",
          provincia: dom?.provincia?.nombre || "",
        });

        setProvinceId(
          dom?.provincia?.codigo ||
            dom?.provincia?.codigoProvincia ||
            dom?.provincia?.id ||
            ""
        );
        setMunicipalityId(
          dom?.municipio?.codigo ||
            dom?.municipio?.codigoMunicipio ||
            dom?.municipio?.id ||
            ""
        );
        setLocalityId(
          dom?.localidad?.codigo ||
            dom?.localidad?.codigoLocalidad ||
            dom?.localidad?.id ||
            ""
        );
      } catch (e) {
        console.log(
          "[BuyTicketScreen] No se pudo precargar datos de usuario:",
          e
        );
      }
    })();
  }, [user]);

  // Provincias
  useEffect(() => {
    (async () => {
      try {
        const provs = await fetchProvinces().catch(
          () => [] as any[]
        );
        setProvinces(provs || []);
      } catch (e) {
        console.log("[BuyTicketScreen] fetchProvinces error:", e);
      }
    })();
  }, []);

  const handleBillingChange = (
    field: keyof BillingAddress,
    value: string
  ) => {
    setBillingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectProvince = async (id: string, nombre: string) => {
    setProvinceId(id);
    handleBillingChange("provincia", nombre);
    setShowProvinces(false);
    setMunicipalityId("");
    setLocalityId("");
    setMunicipalities([]);
    setLocalities([]);
    handleBillingChange("municipio", "");
    handleBillingChange("localidad", "");

    if (id === "02") {
      setMunicipalityId("02");
      handleBillingChange(
        "municipio",
        "Ciudad Autónoma de Buenos Aires"
      );
      // Asegurar que la localidad también muestre CABA visualmente
      setLocalityId("02");
      handleBillingChange("localidad", "Ciudad Autónoma de Buenos Aires");
      try {
        const locs = await fetchLocalitiesByProvince(id).catch(
          () => [] as any[]
        );
        setLocalities(locs || []);
      } catch {}
    } else {
      try {
        const munis = await fetchMunicipalities(String(id)).catch(
          () => [] as any[]
        );
        setMunicipalities(munis || []);
      } catch (e) {
        console.log("[BuyTicketScreen] fetchMunicipalities error:", e);
      }
    }
  };

  const handleSelectMunicipality = async (
    id: string,
    nombre: string
  ) => {
    setMunicipalityId(id);
    handleBillingChange("municipio", nombre);
    setShowMunicipalities(false);
    setLocalityId("");
    setLocalities([]);
    handleBillingChange("localidad", "");
    try {
      const locs = await fetchLocalities(
        String(provinceId),
        String(id)
      ).catch(() => [] as any[]);
      setLocalities(locs || []);
    } catch (e) {
      console.log("[BuyTicketScreen] fetchLocalities error:", e);
    }
  };

  const handleSelectLocality = (id: string, nombre: string) => {
    setLocalityId(id);
    handleBillingChange("localidad", nombre);
    setShowLocalities(false);
  };

  const isBillingComplete = Boolean(
    billingAddress.direccion.trim() &&
      billingAddress.provincia.trim() &&
      billingAddress.municipio.trim() &&
      billingAddress.localidad.trim()
  );

  // Persistir domicilio
  const persistBillingBeforeConfirm = useCallback(
    async (): Promise<boolean> => {
      try {
        if (!isBillingComplete) {
          Alert.alert(
            "Domicilio incompleto",
            "Completá todos los campos de domicilio antes de continuar."
          );
          return false;
        }
        const uid: string | null =
          user?.id ?? user?.idUsuario ?? user?.userId ?? null;
        if (!uid) {
          Alert.alert(
            "Usuario no detectado",
            "Iniciá sesión nuevamente para continuar."
          );
          return false;
        }

        const perfil = await getUsuarioById(String(uid)).catch(
          () => null
        );
        if (!perfil) {
          Alert.alert(
            "Error",
            "No se pudo obtener perfil de usuario para actualizar domicilio."
          );
          return false;
        }

        const norm = (s: any) =>
          String(s ?? "").trim().toLowerCase();
        const prevDom = perfil.domicilio || {};
        const noChanges =
          norm(billingAddress.direccion) ===
            norm(prevDom.direccion) &&
          norm(billingAddress.provincia) ===
            norm(prevDom?.provincia?.nombre) &&
          norm(billingAddress.municipio) ===
            norm(prevDom?.municipio?.nombre) &&
          norm(billingAddress.localidad) ===
            norm(prevDom?.localidad?.nombre);

        if (noChanges) return true;

        let provinciaCodigo = "";
        let municipioCodigo = "";
        let localidadCodigo = "";

        try {
          const provs = await fetchProvinces().catch(
            () => [] as any[]
          );
          const matchProv = provs.find(
            (p: any) =>
              norm(p.nombre) === norm(billingAddress.provincia)
          );
          if (matchProv) {
            provinciaCodigo = String(matchProv.id || matchProv.codigo || "");
          }
          if (provinciaCodigo) {
            const munis = await fetchMunicipalities(
              String(provinciaCodigo)
            ).catch(() => [] as any[]);
            const matchMuni = munis.find(
              (m: any) =>
                norm(m.nombre) === norm(billingAddress.municipio)
            );
            if (matchMuni) {
              municipioCodigo = String(
                matchMuni.id || matchMuni.codigo || ""
              );
            }

            const locs = await fetchLocalitiesByName(
              String(billingAddress.localidad || "")
            ).catch(() => [] as any[]);
            const matchLoc = locs.find(
              (l: any) =>
                norm(l.nombre) === norm(billingAddress.localidad)
            );
            if (matchLoc) {
              localidadCodigo = String(
                matchLoc.id || matchLoc.codigo || ""
              );
            }
          }
        } catch (e) {
          console.log("[BuyTicketScreen] georef error:", e);
        }

        const domicilioPayload = {
          direccion:
            billingAddress.direccion ||
            perfil.domicilio?.direccion ||
            "",
          localidad: {
            nombre:
              billingAddress.localidad ||
              perfil.domicilio?.localidad?.nombre ||
              "",
            codigo:
              localidadCodigo ||
              perfil.domicilio?.localidad?.codigo ||
              "",
          },
          municipio: {
            nombre:
              billingAddress.municipio ||
              perfil.domicilio?.municipio?.nombre ||
              "",
            codigo:
              municipioCodigo ||
              perfil.domicilio?.municipio?.codigo ||
              "",
          },
          provincia: {
            nombre:
              billingAddress.provincia ||
              perfil.domicilio?.provincia?.nombre ||
              "",
            codigo:
              provinciaCodigo ||
              perfil.domicilio?.provincia?.codigo ||
              "",
          },
          latitud: perfil.domicilio?.latitud ?? 0,
          longitud: perfil.domicilio?.longitud ?? 0,
        };

        const payload = {
          idUsuario: perfil.idUsuario,
          nombre: perfil.nombre || "",
          apellido: perfil.apellido || "",
          correo: perfil.correo || "",
          dni: perfil.dni || "",
          telefono: perfil.telefono || "",
          cbu: perfil.cbu || "",
          nombreFantasia: perfil.nombreFantasia || "",
          dtNacimiento:
            perfil.dtNacimiento || new Date().toISOString(),
          domicilio: domicilioPayload,
          cdRoles: perfil.cdRoles || [],
          socials:
            perfil.socials || {
              idSocial: "",
              mdInstagram: "",
              mdSpotify: "",
              mdSoundcloud: "",
            },
        } as any;

        await updateUsuario(payload);
        return true;
      } catch (e) {
        console.log(
          "[BuyTicketScreen] persistBillingBeforeConfirm error:",
          e
        );
        Alert.alert(
          "Error",
          "Ocurrió un error al validar el domicilio."
        );
        return false;
      }
    },
    [billingAddress, isBillingComplete, user]
  );

  return {
    buyerInfo,
    billingAddress,
    handleBillingChange,
    provinces,
    municipalities,
    localities,
    provinceId,
    municipalityId,
    showProvinces,
    showMunicipalities,
    showLocalities,
    setShowProvinces,
    setShowMunicipalities,
    setShowLocalities,
    handleSelectProvince,
    handleSelectMunicipality,
    handleSelectLocality,
    isBillingComplete,
    persistBillingBeforeConfirm,
  };
}

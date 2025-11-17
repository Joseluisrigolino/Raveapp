// Hook helper: encapsula el flujo de eliminación de artista (estado + handlers)
// Comentarios en español para entender cada paso

// React hooks usados en este helper
import { useState, useCallback } from "react";
// Alert se usa para notificaciones rápidas
import { Alert } from "react-native";
// Tipos y APIs del dominio
import { Artist } from "@/app/artists/types/Artist";
import { mediaApi } from "@/app/apis/mediaApi";
import { deleteArtistFromApi } from "@/app/artists/apis/artistApi";

// Tipo que representa el objetivo de borrado: id obligatorio y nombre opcional
export type DeleteTarget = { id: string; name?: string };

// getDeleteTarget: busca en la lista el artista por id y devuelve id + nombre (si existe)
// - recibe la lista actual y el id solicitado
// - si no encuentra el artista devuelve al menos el id para permitir el flujo
export const getDeleteTarget = (list: Artist[], id: string): DeleteTarget | null => {
  const a = list.find((x) => x.idArtista === id);
  if (!a) return { id };
  return { id, name: a.name };
};

// deleteArtistCascade: elimina la media asociada al artista (si la hay) y luego elimina el artista
// - primero pide media por entidad (id del artista)
// - borra cada elemento de media si existe
// - finalmente llama al endpoint que elimina el artista
export const deleteArtistCascade = async (id: string): Promise<void> => {
  const media = await mediaApi.getByEntidad(id);
  if (media?.media?.length) {
    for (const m of media.media) {
      await mediaApi.delete(m.idMedia);
    }
  }
  await deleteArtistFromApi(id);
};

// Hook principal: expone estados y handlers para flujo de eliminación desde UI
export function useArtistDelete(
  artistList: Artist[],
  setArtistList: React.Dispatch<React.SetStateAction<Artist[]>>
) {
  // estado que controla visibilidad del modal de confirmación
  const [deleteVisible, setDeleteVisible] = useState(false);
  // target actual (id y nombre opcional) que se mostrará en el modal
  const [deleteTarget, setDeleteTargetState] = useState<DeleteTarget | null>(null);
  // indicador de que la operación de borrado está en progreso
  const [deleting, setDeleting] = useState(false);
  // estado para controlar el popup de error cuando la eliminación no es posible
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorArtistName, setErrorArtistName] = useState<string | undefined>(undefined);

  // onDelete: abre el modal de confirmación para el id recibido
  // - busca el nombre en la lista para mostrarlo en el modal
  const onDelete = useCallback((id: string) => {
    const t = getDeleteTarget(artistList, id);
    if (t) setDeleteTargetState(t);
    setDeleteVisible(true);
  }, [artistList]);

  // closePopup: cierra el modal de confirmación (siempre que no esté borrando)
  const closePopup = useCallback(() => {
    if (deleting) return; // no cerrar si hay operación en curso
    setDeleteVisible(false);
    setDeleteTargetState(null);
  }, [deleting]);

  // confirmDelete: ejecuta la eliminación en cascada y actualiza la lista local
  const confirmDelete = useCallback(async () => {
    if (!deleteTarget?.id) return; // seguridad: si no hay target, salir
    setDeleting(true); // marcar que está en progreso
    try {
      const id = deleteTarget.id;
      await deleteArtistCascade(id); // borra media + artista
      // actualizar la lista local quitando el artista borrado
      setArtistList((prev) => prev.filter((a) => a.idArtista !== id));
      // cerrar el modal de confirmación y limpiar target
      setDeleteVisible(false);
      setDeleteTargetState(null);
      // notificar éxito (alerta simple)
      Alert.alert("Listo", "Se borró el artista");
    } catch (e) {
      // en caso de error: log y abrir el popup de error (conservar mensaje)
      console.log("Error deleting artist", e);
      // cerrar el popup de confirmación original para evitar superposición
      setDeleteVisible(false);
      setDeleteTargetState(null);
      // guardar nombre para mostrar en popup de error y abrirlo
      setErrorArtistName(deleteTarget?.name);
      setErrorVisible(true);
    } finally {
      // siempre quitar indicador de borrado
      setDeleting(false);
    }
  }, [deleteTarget, setArtistList]);

  // Exponer estados y handlers al componente que use el hook
  return {
    deleteVisible, // visibilidad del modal de confirmación
    deleteTarget, // target seleccionado para borrar
    deleting, // flag de operación en curso
    errorVisible, // visibilidad del modal de error
    errorArtistName, // nombre del artista para mostrar en error
    onDelete, // abrir modal de confirmación
    closePopup, // cerrar modal de confirmación
    confirmDelete, // confirmar y ejecutar borrado
    // handler para cerrar el popup de error
    closeError: useCallback(() => setErrorVisible(false), []),
  };
}

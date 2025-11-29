// app/artists/services/useArtistDelete.ts

// Hook helper: encapsula el flujo de eliminación de artista (estado + handlers)

import { useState, useCallback, Dispatch, SetStateAction } from "react"; // Hooks y tipos de estado
import { Artist } from "@/app/artists/types/Artist"; // Tipo de artista
import { mediaApi } from "@/app/apis/mediaApi"; // API de media (para borrar imágenes asociadas)
import { deleteArtistFromApi } from "@/app/artists/apis/artistApi"; // API para borrar el artista en sí

// Representa el artista objetivo a borrar: al menos el id, opcionalmente el nombre.
export type DeleteTarget = {
  id: string;
  name?: string;
};

// Busca un artista por id en la lista y arma el DeleteTarget (id + name si está).
export const getDeleteTarget = (
  list: Artist[],
  id: string
): DeleteTarget | null => {
  const found = list.find((artist) => artist.idArtista === id);
  if (!found) return { id };
  return { id, name: found.name };
};

// Elimina media asociada al artista (si hay) y luego elimina al artista en la API.
export const deleteArtistCascade = async (id: string): Promise<void> => {
  const media = await mediaApi.getByEntidad(id);

  if (media?.media?.length) {
    for (const m of media.media) {
      // Borramos cada item de media de la entidad (fotos del artista, etc.)
      await mediaApi.delete(m.idMedia);
    }
  }

  // Una vez limpia la media, borramos al artista en el backend
  await deleteArtistFromApi(id);
};

// Hook principal: expone estados y handlers para manejar el borrado desde la UI.
export function useArtistDelete(
  artistList: Artist[],
  setArtistList: Dispatch<SetStateAction<Artist[]>>
) {
  // Controla si el popup de confirmación está visible
  const [deleteVisible, setDeleteVisible] = useState(false);
  // Guarda el artista objetivo (id + nombre opcional)
  const [deleteTarget, setDeleteTargetState] = useState<DeleteTarget | null>(
    null
  );
  // Flag de “estamos borrando”, para deshabilitar botones y mostrar loaders
  const [deleting, setDeleting] = useState(false);
  // Controla visibilidad del popup de error
  const [errorVisible, setErrorVisible] = useState(false);
  // Nombre del artista que falló al borrar (para mostrar en el popup de error)
  const [errorArtistName, setErrorArtistName] = useState<string | undefined>(
    undefined
  );

  // Abre el popup de confirmación para el id que recibe.
  // Busca además el nombre para mostrar un mensaje más claro.
  const onDelete = useCallback(
    (id: string) => {
      const target = getDeleteTarget(artistList, id);
      if (target) setDeleteTargetState(target);
      setDeleteVisible(true);
    },
    [artistList]
  );

  // Cierra el popup de confirmación (siempre que no estemos en medio del borrado).
  const closePopup = useCallback(() => {
    if (deleting) return;
    setDeleteVisible(false);
    setDeleteTargetState(null);
  }, [deleting]);

  // Ejecuta el borrado real:
  // - borra media + artista
  // - actualiza la lista local
  // - maneja estados de error y popups
  const confirmDelete = useCallback(async () => {
    if (!deleteTarget?.id) return;

    setDeleting(true);

    try {
      const id = deleteTarget.id;
      await deleteArtistCascade(id);

      // Sacamos al artista borrado de la lista local
      setArtistList((prev) => prev.filter((a) => a.idArtista !== id));

      // Cerramos popup y limpiamos target
      setDeleteVisible(false);
      setDeleteTargetState(null);

      // No mostramos Alert nativo: el feedback visual es que la card desaparece.
      // (Si después querés, acá se puede enganchar un popup de "eliminado con éxito")
    } catch (err) {
      console.log("Error deleting artist", err);

      // Cerramos el popup de confirmación
      setDeleteVisible(false);
      setDeleteTargetState(null);

      // Mostramos el popup de error específico con el nombre del artista
      setErrorArtistName(deleteTarget?.name);
      setErrorVisible(true);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, setArtistList]);

  // Cierra el popup de error
  const closeError = useCallback(() => {
    setErrorVisible(false);
  }, []);

  // Lo que exponemos al componente
  return {
    deleteVisible,
    deleteTarget,
    deleting,
    errorVisible,
    errorArtistName,
    onDelete,
    closePopup,
    confirmDelete,
    closeError,
  };
}

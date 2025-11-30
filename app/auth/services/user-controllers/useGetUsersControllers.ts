import { useEffect, useState, useCallback } from "react";
import { getControllerUsers } from "../../apis/user-controller/controllerUserApi";
import { ControllerUser } from "@/app/auth/types/ControllerUser";

// Hook simple para obtener la lista de usuarios controladores
// Comentarios en español, internals en inglés
export default function useGetUsersControllers(orgId: string | null) {
  const [users, setUsers] = useState<ControllerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchUsers = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const list = await getControllerUsers(id);
      setUsers(list);
      return list;
    } catch (e) {
      setError(e);
      setUsers([]);
      return [] as ControllerUser[];
    } finally {
      setLoading(false);
    }
  }, []);

  // refresca cuando cambia orgId
  useEffect(() => {
    if (!orgId) {
      setUsers([]);
      return;
    }
    fetchUsers(orgId);
  }, [orgId, fetchUsers]);

  return { users, loading, error, refresh: () => orgId && fetchUsers(orgId) } as const;
}

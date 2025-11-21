// app/party/services/useDeleteParty.ts
import { useState } from "react";
import { deleteParty } from "@/app/party/apis/partysApi";

export default function useDeleteParty() {
  const [loading, setLoading] = useState<boolean>(false);

  async function doDelete(id: string) {
    setLoading(true);
    try {
      await deleteParty(id);
    } finally {
      setLoading(false);
    }
  }

  return { deleteParty: doDelete, loading } as const;
}

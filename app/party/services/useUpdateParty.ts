// app/party/services/useUpdateParty.ts
import { useState } from "react";
import { updateParty } from "@/app/party/apis/partysApi";

type UpdatePartyPayload = {
  idFiesta: string;
  nombre?: string;
  isActivo?: boolean;
};

export default function useUpdateParty() {
  const [loading, setLoading] = useState<boolean>(false);

  async function doUpdate(payload: UpdatePartyPayload) {
    setLoading(true);
    try {
      await updateParty(payload);
    } finally {
      setLoading(false);
    }
  }

  return { updateParty: doUpdate, loading } as const;
}

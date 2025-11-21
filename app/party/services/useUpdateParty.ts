import { useState } from "react";
import { updateParty } from "@/app/party/apis/partysApi";

export default function useUpdateParty() {
  const [loading, setLoading] = useState<boolean>(false);

  async function doUpdate(payload: any) {
    setLoading(true);
    try {
      const res = await updateParty(payload);
      return res;
    } finally {
      setLoading(false);
    }
  }

  return { updateParty: doUpdate, loading } as const;
}

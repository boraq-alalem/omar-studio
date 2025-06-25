import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

export function useThesisFromBothApis(id: number | string | undefined) {
  const [main, setMain] = useState<any>(null);
  const [local, setLocal] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    // جلب من الاستضافة
    fetchApi(`/theses/${id}`, { method: "GET" })
      .then(setMain)
      .catch(() => setError("تعذر جلب بيانات الرسالة من الموقع الرئيسي"));
    // جلب من المحلي
    fetchApi(`/theses/${id}`, { method: "GET" })
      .then(setLocal)
      .catch(() => setError("تعذر جلب بيانات الرسالة من الخادم المحلي"));
    setLoading(false);
  }, [id]);

  return { main, local, loading, error };
}

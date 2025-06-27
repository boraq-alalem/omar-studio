'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { EXTERNAL_LINKS } from '@/lib/endpoints';

interface ServerErrorContextType {
  error: string | null;
  setError: (msg: string | null) => void;
}

const ServerErrorContext = createContext<ServerErrorContextType>({ error: null, setError: () => {} });

export const useServerError = () => useContext(ServerErrorContext);

export const ServerErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);
  const [disconnected, setDisconnected] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const servers = [
      { url: EXTERNAL_LINKS.API_BASE_URL_LOCAL, label: 'الخادم المحلي' },
      { url: EXTERNAL_LINKS.API_BASE_URL_PROD, label: 'الاستضافة' }
    ];
    let toastId: string | undefined;
    // دالة لإغلاق التوستر يدويًا
    function closeToast() {
      const toastRoot = document.querySelector('[role="status"]');
      if (toastRoot) {
        // إغلاق جميع التوسترات المفتوحة
        (toastRoot as HTMLElement).querySelectorAll('button[aria-label="Close"]').forEach(btn => (btn as HTMLElement).click());
      }
    }
    async function checkServers() {
      let anyDisconnected = null;
      for (const { url, label } of servers) {
        try {
          const statsUrl = url.endsWith('/') ? url + 'stats' : url + '/stats';
          const res = await fetch(statsUrl, { method: 'GET' });
          if (!res.ok) throw new Error();
        } catch {
          anyDisconnected = label;
          break;
        }
      }
      if (anyDisconnected) {
        if (!disconnected) {
          closeToast();
          toastId = toast({
            title: 'تنبيه',
            description: `لا يمكن الاتصال بـ ${anyDisconnected}`,
            variant: 'destructive',
            duration: Infinity,
          }).id;
          setDisconnected(anyDisconnected);
        }
      } else if (disconnected) {
        closeToast();
        toast({
          title: 'تمت اعادة الاتصال',
          description: '',
          variant: 'default',
          duration: 3000,
          className: 'bg-green-500 text-white',
        });
        setDisconnected(null);
      }
    }
    checkServers();
    interval = setInterval(checkServers, 4000);
    return () => clearInterval(interval);
  }, [disconnected]);

  return (
    <ServerErrorContext.Provider value={{ error, setError }}>
      {children}
    </ServerErrorContext.Provider>
  );
};

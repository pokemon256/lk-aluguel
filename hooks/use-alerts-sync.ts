"use client";

import { useEffect, useState } from "react";

export type AlertItem = {
  id: string;
  titulo: string;
  corpo: string;
  url: string | null;
  lida: boolean;
  tipo: string | null;
  createdAt: string;
};

export type AlertsData = {
  updatedAt: number;
  unread: number;
  list: AlertItem[];
  contadores: { atrasados: number; pendentes: number };
};

// Singleton: evita N timers quando Bell + painel montam juntos.
const singleton: {
  data: AlertsData | null;
  listeners: Set<(d: AlertsData) => void>;
  timer: number | null;
  etag: string | null;
  bc: BroadcastChannel | null;
  started: boolean;
} = { data: null, listeners: new Set(), timer: null, etag: null, bc: null, started: false };

try {
  singleton.bc = new BroadcastChannel("lk-bell");
  singleton.bc.onmessage = (ev: MessageEvent) => {
    const d = ev.data as AlertsData | null;
    if (!d || typeof d.updatedAt !== "number") return;
    singleton.data = d;
    singleton.etag = `${d.unread}:${d.updatedAt}`;
    singleton.listeners.forEach((fn) => fn(d));
  };
} catch {}

function intervalMs() {
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return 120000;
  return 60000;
}

const FALLBACK: AlertsData = { updatedAt: 0, unread: 0, list: [], contadores: { atrasados: 0, pendentes: 0 } };

async function fetchDelta() {
  const current = singleton.data ?? FALLBACK;
  const since = current.updatedAt ?? 0;
  const etag = singleton.etag ?? String(since);
  try {
    const res = await fetch(`/api/alertas/delta?since=${encodeURIComponent(String(since))}`, {
      headers: { "If-None-Match": etag },
      cache: "no-store",
    });
    if (res.status === 304) return;
    if (!res.ok) return;
    const json = await res.json();
    if (!json?.ok) return;
    const nd: AlertsData = {
      updatedAt: json.updatedAt ?? Date.now(),
      unread: json.unread ?? 0,
      list: json.list ?? [],
      contadores: json.contadores ?? current.contadores,
    };
    singleton.data = nd;
    singleton.etag = `${nd.unread}:${nd.updatedAt}`;
    singleton.listeners.forEach((fn) => fn(nd));
    try {
      singleton.bc?.postMessage(nd);
    } catch {}
  } catch {}
}

export function useAlertsSync(enabled = true) {
  const [data, setData] = useState<AlertsData>(() => singleton.data ?? FALLBACK);

  useEffect(() => {
    if (!enabled) return;
    const listener = (d: AlertsData) => setData(d);
    singleton.listeners.add(listener);

    if (!singleton.started) {
      singleton.started = true;
      let timer: number | null = null;
      const schedule = () => {
        timer = window.setTimeout(async () => {
          await fetchDelta();
          singleton.timer = schedule() as unknown as number;
        }, intervalMs()) as unknown as number;
        singleton.timer = timer as unknown as number;
        return timer;
      };
      // Primeira carga imediata
      fetchDelta();
      singleton.timer = schedule() as unknown as number;

      const onVisible = () => {
        if (document.visibilityState === "visible") fetchDelta();
      };
      document.addEventListener("visibilitychange", onVisible);
      window.addEventListener("focus", onVisible);

      return () => {
        document.removeEventListener("visibilitychange", onVisible);
        window.removeEventListener("focus", onVisible);
        if (singleton.timer) window.clearTimeout(singleton.timer);
        singleton.timer = null;
        singleton.started = false;
      };
    }

    return () => {
      singleton.listeners.delete(listener);
    };
  }, [enabled]);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
    const nd: AlertsData = { ...data, unread: 0, list: data.list.map((i) => ({ ...i, lida: true })) };
    singleton.data = nd;
    setData(nd);
  }

  function markRead(id: string) {
    try {
      const blob = new Blob([JSON.stringify({ ids: [id] })], { type: "application/json" });
      navigator.sendBeacon("/api/notifications", blob);
    } catch {}
    const nd: AlertsData = {
      ...data,
      unread: Math.max(0, data.unread - 1),
      list: data.list.map((i) => (i.id === id ? { ...i, lida: true } : i)),
    };
    singleton.data = nd;
    setData(nd);
  }

  return { ...data, markAll, markRead };
}

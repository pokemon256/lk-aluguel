export function formatKz(valor: number): string {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatData(d: Date | string): string {
  return new Intl.DateTimeFormat("pt-AO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(d));
}

export function formatDataHora(d: Date | string): string {
  return new Intl.DateTimeFormat("pt-AO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

/** Devolução prevista = evento + 24h (regra de negócio) */
export function devolucaoPrevista(dataEvento: Date): Date {
  const d = new Date(dataEvento);
  d.setHours(d.getHours() + 24);
  return d;
}

export type MonthBucket = { key: string; label: string };

/**
 * Janela de N+1 meses a terminar no mês atual OU no mês com dados mais
 * recente (o que for mais à frente) — para reservas futuras aparecerem.
 */
export function monthWindow(anchors: Date[], back = 7): MonthBucket[] {
  const now = new Date();
  let end = new Date(now.getFullYear(), now.getMonth(), 1);
  for (const d of anchors) {
    const s = new Date(d.getFullYear(), d.getMonth(), 1);
    if (s > end) end = s;
  }
  const out: MonthBucket[] = [];
  for (let i = back; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: new Intl.DateTimeFormat("pt-AO", { month: "short" })
        .format(d)
        .replace(".", ""),
    });
  }
  return out;
}

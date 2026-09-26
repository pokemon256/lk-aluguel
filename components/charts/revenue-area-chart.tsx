"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatKz } from "@/lib/format"

function compactKz(v: number): string {
  if (v <= 0) return "0"
  return `${new Intl.NumberFormat("pt-AO", { notation: "compact" }).format(v)} Kz`
}

const axisTick = { fill: "#4a3a32", fontSize: 12, fontWeight: 600 } as const

const SERIES_PT: Record<string, string> = {
  receita: "Receita",
  faturado: "Faturado",
  recebido: "Recebido",
}

/** Devolve [nome, valor] para o tooltip mostrar a etiqueta da série + valor em Kz. */
function moneyFormatter(value: string | number | Array<string | number>, name: string | number) {
  return [
    <span key="n" className="text-[#4a3a32]/70">
      {SERIES_PT[String(name)] ?? String(name)}
    </span>,
    <span key="v" className="ml-auto font-mono font-medium tabular-nums text-[#241a16]">
      {formatKz(Number(value))}
    </span>,
  ]
}

/** Receita mensal — área única em terracota/dourado (Análises). */
export function RevenueAreaChart({ data }: { data: { label: string; receita: number }[] }) {
  const config = {
    receita: { label: "Receita", color: "#c25527" },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <AreaChart data={data} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
        <defs>
          <linearGradient id="fillReceita" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#c25527" stopOpacity={0.45} />
            <stop offset="60%" stopColor="#d9ab3c" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#d9ab3c" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#e9ddc6" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} tick={axisTick} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={72}
          tickFormatter={compactKz}
          tick={axisTick}
        />
        <ChartTooltip
          cursor={{ stroke: "#d9c8a6", strokeWidth: 1.5 }}
          content={<ChartTooltipContent formatter={moneyFormatter} />}
        />
        <Area
          dataKey="receita"
          type="natural"
          fill="url(#fillReceita)"
          stroke="#c25527"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: "#c25527", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}

/** Faturado vs recebido por mês — duas áreas (Finanças). */
export function FinanceAreaChart({
  data,
}: {
  data: { label: string; faturado: number; recebido: number }[]
}) {
  const config = {
    faturado: { label: "Faturado", color: "#241a16" },
    recebido: { label: "Recebido", color: "#059669" },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <AreaChart data={data} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
        <defs>
          <linearGradient id="fillFaturado" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#241a16" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#241a16" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillPago" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#e9ddc6" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} tick={axisTick} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={72}
          tickFormatter={compactKz}
          tick={axisTick}
        />
        <ChartTooltip
          cursor={{ stroke: "#d9c8a6", strokeWidth: 1.5 }}
          content={<ChartTooltipContent formatter={moneyFormatter} />}
        />
        <Area
          dataKey="faturado"
          type="natural"
          fill="url(#fillFaturado)"
          stroke="#241a16"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: "#241a16", stroke: "#fff", strokeWidth: 2 }}
        />
        <Area
          dataKey="recebido"
          type="natural"
          fill="url(#fillPago)"
          stroke="#059669"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: "#059669", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}

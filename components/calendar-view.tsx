"use client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useRouter } from "next/navigation";

export type CalEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
  detalhe?: string; // tooltip: "Levantamento … → Devolução …"
};

export function CalendarView({ events, initialDate }: { events: CalEvent[]; initialDate?: string }) {
  const router = useRouter();
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      initialDate={initialDate}
      locale="pt"
      height="auto"
      displayEventTime={false}
      headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek" }}
      events={events.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        backgroundColor:
          e.status === "ATRASADO" ? "#dc2626" : e.status === "ATIVO" ? "#059669" : e.status === "PENDENTE" ? "#d97706" : "#52525b",
        borderColor: "transparent",
        extendedProps: { detalhe: e.detalhe },
      }))}
      eventDidMount={(info) => {
        const d = (info.event.extendedProps as { detalhe?: string }).detalhe;
        if (d) info.el.setAttribute("title", d);
      }}
      eventClick={(info) => {
        info.jsEvent.preventDefault();
        router.push(`/alugueres/${info.event.id}`);
      }}
    />
  );
}

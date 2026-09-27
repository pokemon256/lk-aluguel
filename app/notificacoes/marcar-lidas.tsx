"use client";

import { useState } from "react";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarcarLidas() {
  const [ok, setOk] = useState(false);
  async function marcar() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
    setOk(true);
    window.location.reload();
  }
  return (
    <Button variant="secondary" size="sm" onClick={marcar} disabled={ok}>
      <CheckCheck className="size-4" /> {ok ? "Marcadas" : "Marcar todas como lidas"}
    </Button>
  );
}

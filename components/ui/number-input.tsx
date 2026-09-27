"use client";
import { useState } from "react";
import { Input } from "@/components/ui/primitives";

type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "defaultValue"
> & {
  value: number;
  onChange: (n: number) => void;
};

/**
 * Input numérico controlado que permite apagar todos os dígitos.
 * O campo pode ficar vazio (mostra "") enquanto o valor lógico é 0 —
 * evita o "0" forçado que impedia de reescrever o número.
 */
export function NumberInput({ value, onChange, ...props }: Props) {
  const [texto, setTexto] = useState(String(value));
  const [ultimo, setUltimo] = useState(value);
  // Sincroniza quando o valor muda por fora (padrão "adjust during render").
  if (value !== ultimo) {
    setUltimo(value);
    setTexto(String(value));
  }

  return (
    <Input
      {...props}
      type="number"
      value={texto}
      onChange={(e) => {
        const raw = e.target.value;
        setTexto(raw);
        onChange(raw.trim() === "" ? 0 : Number(raw));
      }}
    />
  );
}

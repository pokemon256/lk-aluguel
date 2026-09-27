"use client";
import Link from "next/link";

/**
 * Último recurso: quando o próprio layout falha.
 * Tem de trazer <html><body> próprios e não pode usar componentes
 * do layout (usa estilos inline para não depender de CSS externo).
 */
export default function ErroGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-AO">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#faf7f1",
          color: "#241a16",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: 24, maxWidth: 480 }}>
          <p style={{ fontSize: 48, margin: 0 }}>⚠️</p>
          <h1 style={{ fontSize: 24, margin: "12px 0 8px" }}>Algo correu mal</h1>
          <p style={{ fontSize: 14, opacity: 0.7 }}>
            {error.message || "Ocorreu um erro inesperado."}
          </p>
          <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                border: "none",
                background: "#a8431d",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Tentar de novo
            </button>
            <Link
              href="/"
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                border: "1px solid #241a1633",
                color: "#241a16",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Voltar ao painel
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

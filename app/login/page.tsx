import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { CalendarCheck, Package, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/primitives";
import { PasswordInput } from "@/components/ui/password-input";
import { InstallAppButton } from "@/components/install-app";

const bullets = [
  { icon: Package, text: "Stock em tempo real, sem papel nem caderno" },
  { icon: CalendarCheck, text: "Reservas, eventos e devoluções num só calendário" },
  { icon: PartyPopper, text: "Cauções e pagamentos sempre sob controlo" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center gap-6 py-8 lg:grid-cols-[1.1fr_1fr]">
      {/* Painel da marca */}
      <div className="relative hidden overflow-hidden rounded-[2rem] bg-ink-950 p-10 text-cream-50 lg:block animate-rise">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 size-72 rounded-full bg-brand-600/40 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 size-72 rounded-full bg-gold-500/20 blur-3xl" />
        </div>
        <div className="relative">
          <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 font-display text-xl font-bold text-white shadow-lg">
            LK
          </span>
          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-300">
            Festas & Decoração
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1] tracking-tight">
            Tudo o que a festa precisa, sob controlo.
          </h1>
          <ul className="mt-8 flex flex-col gap-4">
            {bullets.map((b) => (
              <li key={b.text} className="flex items-center gap-3 text-sm text-cream-50/80">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/8 ring-1 ring-white/10">
                  <b.icon className="size-4 text-gold-300" />
                </span>
                {b.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Formulário */}
      <div className="animate-rise rounded-[2rem] border border-ink-900/10 bg-white p-8 shadow-[0_24px_64px_-32px_rgba(23,15,12,0.35)] md:p-10">
        <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 font-display text-xl font-bold text-white lg:hidden">
          LK
        </span>
        <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink-950 lg:mt-0">
          Bem-vinda de volta
        </h2>
        <p className="mt-1 text-sm text-ink-700/65">Entrada restrita à gestão da loja.</p>
        <form
          className="mt-6 flex flex-col gap-4"
          action={async (fd: FormData) => {
            "use server";
            try {
              await signIn("credentials", {
                email: fd.get("email"),
                password: fd.get("password"),
                redirectTo: "/",
              });
            } catch (e) {
              if (e instanceof AuthError) redirect("/login?error=1");
              throw e;
            }
          }}
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="mae@lk-aluguel.ao" autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Palavra-passe</Label>
            <PasswordInput id="password" name="password" required autoComplete="current-password" />
          </div>
          {sp.error && (
            <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
              Credenciais inválidas. Tenta de novo.
            </p>
          )}
          <Button type="submit" size="lg" className="mt-1 w-full">
            Entrar
          </Button>
        </form>
        <div className="mt-4 border-t border-ink-900/10 pt-4">
          <InstallAppButton />
          <p className="mt-2 text-center text-xs text-ink-700/55">
            Instala para acesso rápido e consulta offline.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BellRing,
  CalendarDays,
  CalendarCheck,
  ChartColumn,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PartyPopper,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RouteLoader } from "@/components/route-loader";
import { InstallAppButton } from "@/components/install-app";
import { signOut } from "next-auth/react";
import { Bell } from "@/components/bell";
import { PushSync } from "@/components/push-toggle";

const mobileTabs = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/alugueres", label: "Alugueres", icon: CalendarCheck },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/financas", label: "Finanças", icon: Wallet },
];

function isActive(path: string, href: string) {
  return path === href || (href !== "/" && path.startsWith(href));
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 font-display text-lg font-bold text-white shadow-lg shadow-brand-900/30">
        LK
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-semibold tracking-tight">LK Aluguel</span>
        <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-gold-300">
          Festas & Decoração
        </span>
      </span>
    </Link>
  );
}

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: { nome: string; role: string } | null;
}) {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  if (path === "/login") return <>{children}</>;
  const isAdmin = user?.role === "ADMIN";
  const maisActive = ["/materiais", "/clientes", "/analises", "/utilizadores"].some((h) => isActive(path, h));
  const sections = [
    {
      title: "Principal",
      links: [
        { href: "/", label: "Painel", icon: LayoutDashboard },
        { href: "/alugueres", label: "Alugueres", icon: CalendarCheck },
        { href: "/calendario", label: "Calendário", icon: CalendarDays },
        { href: "/notificacoes", label: "Notificações", icon: BellRing },
      ],
    },
    {
      title: "Gestão",
      links: [
        { href: "/materiais", label: "Materiais", icon: Package },
        { href: "/clientes", label: "Clientes", icon: Users },
      ],
    },
    {
      title: "Negócio",
      links: [
        { href: "/analises", label: "Análises", icon: ChartColumn },
        { href: "/financas", label: "Finanças", icon: Wallet },
        ...(isAdmin ? [{ href: "/utilizadores", label: "Utilizadores", icon: ShieldCheck }] : []),
      ],
    },
  ];
  const allLinks = sections.flatMap((s) => s.links);

  return (
    <>
      <RouteLoader />
      <PushSync />
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-ink-950 text-cream-50 md:flex">
        <div className="flex items-center justify-between px-6 pb-2 pt-7 text-cream-50">
          <Brand />
          <Bell dark />
        </div>
        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-6">
          {sections.map((sec) => (
            <div key={sec.title}>
              <p className="px-3.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cream-50/35">
                {sec.title}
              </p>
              <div className="flex flex-col gap-1">
                {sec.links.map((l) => {
                  const Icon = l.icon;
                  const active = isActive(path, l.href);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                        active
                          ? "bg-brand-600 text-white shadow-lg shadow-brand-950/40"
                          : "text-cream-50/65 hover:bg-white/5 hover:text-cream-50"
                      )}
                    >
                      <Icon className={cn("size-[18px]", active ? "text-gold-200" : "text-cream-50/45 group-hover:text-gold-200")} />
                      {l.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4">
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-gold-200">
              <PartyPopper className="size-4" /> Boa festa!
            </p>
            <p className="mt-1 text-xs leading-relaxed text-cream-50/55">
              Confirma as devoluções de hoje antes de fechar.
            </p>
          </div>
          {user && (
            <div className="mt-3 flex items-center gap-3 rounded-xl px-3.5 py-2.5 ring-1 ring-white/10 bg-white/5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
                {user.nome.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13px] font-semibold text-cream-50">{user.nome}</span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300">{user.role}</span>
              </span>
            </div>
          )}
          <InstallAppButton variant="menu" />
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-cream-50/65 transition-colors hover:bg-white/5 hover:text-cream-50 cursor-pointer"
          >
            <LogOut className="size-[18px]" /> Terminar sessão
          </button>
        </div>
      </aside>

      {/* Barra superior — telemóvel */}
      <header className="sticky top-0 z-30 border-b border-ink-900/10 bg-cream-50/85 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between px-4 py-3 text-ink-900">
          <Brand />
          <div className="flex items-center gap-2">
            <Bell />
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="Terminar sessão"
              className="grid size-9 place-items-center rounded-full bg-ink-900/5 text-ink-800 cursor-pointer"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="md:pl-64">
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 md:px-8 md:pb-16 md:pt-8">
          {children}
        </main>
      </div>

      {/* Tab bar — telemóvel */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-900/10 bg-cream-50/95 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-5 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5">
          {mobileTabs.map((l) => {
            const Icon = l.icon;
            const active = isActive(path, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold transition-colors",
                  active ? "text-brand-700" : "text-ink-800/45"
                )}
              >
                <span className={cn("grid size-8 place-items-center rounded-full", active && "bg-brand-100")}>
                  <Icon className="size-5" />
                </span>
                {l.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMenuOpen(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold transition-colors cursor-pointer",
              maisActive ? "text-brand-700" : "text-ink-800/45"
            )}
          >
            <span className={cn("grid size-8 place-items-center rounded-full", maisActive && "bg-brand-100")}>
              <Menu className="size-5" />
            </span>
            Mais
          </button>
        </div>
      </nav>

      {/* Menu completo — telemóvel */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink-950/55 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[1.75rem] bg-cream-50 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl animate-rise">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-lg font-semibold text-ink-950">Menu</p>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Fechar menu"
                className="grid size-9 place-items-center rounded-full bg-ink-900/5 text-ink-700 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {allLinks.map((l) => {
                const Icon = l.icon;
                const active = isActive(path, l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold",
                      active ? "bg-brand-600 text-white" : "text-ink-900 hover:bg-ink-900/5"
                    )}
                  >
                    <Icon className="size-5" />
                    {l.label}
                  </Link>
                );
              })}
              <InstallAppButton variant="menulight" />
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-ink-900 hover:bg-ink-900/5 cursor-pointer"
              >
                <LogOut className="size-5" />
                Terminar sessão
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

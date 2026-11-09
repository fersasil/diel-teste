"use client";

import { LayoutDashboard, Store } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode, type WheelEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatReadingAt } from "../shared/format";
import { messages } from "../shared/messages/pt-BR";

export function DashboardShell({
  profileLabel,
  clientName,
  showSwitch,
  asOf,
  children,
}: {
  profileLabel: string;
  clientName: string | null;
  showSwitch: boolean;
  asOf: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const scroller = useRef<HTMLDivElement>(null);

  function scrollFromSidebar(event: WheelEvent<HTMLElement>) {
    scroller.current?.scrollBy({ top: event.deltaY });
  }

  function leave() {
    document.cookie = "accessToken=; Path=/; Max-Age=0; SameSite=Lax";
    window.location.href = "/entrar";
  }

  return (
    <div className="flex h-svh overflow-hidden bg-muted">
      <aside
        className="hidden h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex"
        onWheel={scrollFromSidebar}
      >
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="rounded-lg bg-white px-2 py-1">
            <img src="/brand/logo-diel-energia-header.svg" alt="Diel" className="h-8 w-auto" />
          </div>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          <NavLink href="/" active={pathname === "/"} icon={<LayoutDashboard className="size-4" />}>
            {messages.dashboardTitle}
          </NavLink>
          <NavLink href="/rede" active={pathname.startsWith("/rede")} icon={<Store className="size-4" />}>
            {messages.networkTitle}
          </NavLink>
        </nav>
        <p className="mt-auto px-4 py-4 text-xs text-sidebar-foreground/70">{messages.productName}</p>
      </aside>
      <div ref={scroller} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="flex flex-wrap items-center gap-3 border-b bg-background px-4 py-3">
          <img src="/brand/logo-diel-energia-header.svg" alt="" className="h-7 w-auto md:hidden" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profileLabel}</p>
            {clientName ? <p className="truncate text-xs text-muted-foreground">{clientName}</p> : null}
            <p className="truncate text-xs text-muted-foreground">
              {asOf
                ? `${messages.virtualNow} ${formatReadingAt(asOf, "America/Sao_Paulo")}`
                : messages.waitingTelemetry}
            </p>
          </div>
          {showSwitch ? (
            <a href="/entrar/foco" className="text-sm text-primary">{messages.switchClient}</a>
          ) : null}
          <Button type="button" variant="outline" onClick={leave}>{messages.leave}</Button>
        </header>
        {children}
      </div>
    </div>
  );
}

function NavLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
        active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
      )}
    >
      {icon}
      {children}
    </a>
  );
}

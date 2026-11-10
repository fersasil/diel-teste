import type { ReactNode } from "react";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { DashboardShell } from "../components/dashboard-shell";
import { profileLabel } from "../shared/messages/pt-BR";
import { loadSession, type SessionBody } from "../session/session";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = localFont({
  src: [
    { path: "../brand/fonts/inter-400-latin.woff2", weight: "400", style: "normal" },
    { path: "../brand/fonts/inter-700-latin.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

function isSession(value: SessionBody | string): value is SessionBody {
  return typeof value === "object" && value !== null && "profile" in value;
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const token = (await cookies()).get("accessToken")?.value ?? "";
  const session = token ? await loadSession(token) : null;
  const visible = session && isSession(session) ? session : null;
  return (
    <html lang="pt-BR" className={cn("font-sans", inter.variable)}>
      <body>
        {visible ? (
          <DashboardShell
            profileLabel={profileLabel[visible.profile]}
            clientName={visible.clientName}
            showSwitch={visible.profile === "diel_operator" && Boolean(visible.clientId)}
            operator={visible.profile === "diel_operator"}
            asOf={visible.asOf ?? null}
          >
            {children}
          </DashboardShell>
        ) : children}
      </body>
    </html>
  );
}

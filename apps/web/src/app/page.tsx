import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HomeDashboard } from "../components/home-dashboard";
import { loadDashboard } from "../dashboard/load-dashboard";
import { messages } from "../shared/messages/pt-BR";
import { loadSession, type SessionBody } from "../session/session";

export default async function HomePage() {
  const token = (await cookies()).get("accessToken")?.value ?? "";
  if (!token) {
    redirect("/entrar");
  }
  const session = await loadSession(token);
  if (session === "session") {
    redirect("/entrar?aviso=sessao");
  }
  if (isSession(session) && session.profile === "diel_operator" && !session.clientId) {
    redirect("/entrar/foco");
  }
  const loaded = await loadDashboard(token);
  if (loaded === "session") {
    redirect("/entrar?aviso=sessao");
  }
  if (loaded === "focus") {
    redirect("/entrar/foco");
  }
  if (loaded === "failure") {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{messages.dashboardTitle}</h1>
        <p><a className="text-sm text-primary" href="/">{messages.loadFailed}</a></p>
      </main>
    );
  }
  return (
    <HomeDashboard
      token={token}
      clientName={isSession(session) ? session.clientName : null}
      summary={loaded}
    />
  );
}

function isSession(value: SessionBody | string): value is SessionBody {
  return typeof value === "object" && value !== null && "profile" in value;
}

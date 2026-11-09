import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginArt } from "./login-art";
import { LoginForm } from "./login-form";
import { messages } from "../../shared/messages/pt-BR";
import { loadSession } from "../../session/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const token = (await cookies()).get("accessToken")?.value ?? "";
  if (token) {
    const session = await loadSession(token);
    if (typeof session === "object" && session !== null && "profile" in session) {
      redirect(session.profile === "diel_operator" && !session.clientId ? "/entrar/foco" : "/");
    }
  }
  const aviso = (await searchParams).aviso;
  return (
    <main className="flex min-h-svh flex-col bg-background md:flex-row">
      <LoginArt />
      <section className="flex flex-1 flex-col bg-white px-6 py-8 sm:px-10 lg:px-16 xl:px-20">
        <div className="mx-auto flex w-full max-w-[27rem] flex-1 flex-col justify-center">
          <img src="/brand/logo-diel-energia-header.svg" alt="Diel" className="h-9 w-auto self-start" />
          <p className="mt-8 text-xs font-semibold tracking-[0.2em] text-primary uppercase">{messages.productName}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{messages.loginTitle}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            <span className="md:hidden">{messages.loginLead}</span>
            <span className="hidden md:inline">{messages.loginHint}</span>
          </p>
          {aviso === "sessao" ? (
            <p className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive" role="status">
              {messages.sessionEnded}
            </p>
          ) : null}
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
        <p className="mx-auto w-full max-w-[27rem] border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
          {messages.loginFoot}
        </p>
      </section>
    </main>
  );
}

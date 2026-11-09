import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ClientTable } from "../../../components/client-table";
import { TablePager } from "../../../components/table-pager";
import { clientHref, parseClientQuerySort, type ClientQuery } from "../../../clients/client-query";
import { loadClients } from "../../../clients/load-clients";
import { messages } from "../../../shared/messages/pt-BR";
import { loadSession, type SessionBody } from "../../../session/session";
import { Input } from "@/components/ui/input";

export default async function FocusPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const token = (await cookies()).get("accessToken")?.value ?? "";
  if (!token) {
    redirect("/entrar?aviso=sessao");
  }
  const session = await loadSession(token);
  if (session === "session") {
    redirect("/entrar?aviso=sessao");
  }
  if (!isSession(session) || session.profile !== "diel_operator") {
    redirect("/");
  }
  const params = await searchParams;
  const requested = Number(params.page ?? "1");
  const query: ClientQuery = {
    page: Number.isInteger(requested) && requested > 0 ? requested : 1,
    q: params.q ?? "",
    ...parseClientQuerySort(params.sort, params.dir),
  };
  const loaded = await loadClients(token, query);
  if (loaded === "session") {
    redirect("/entrar?aviso=sessao");
  }
  if (loaded === "failure" || loaded === "focus") {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{messages.focusTitle}</h1>
        <p><a className="text-sm text-primary" href={clientHref(query)}>{messages.loadFailed}</a></p>
      </main>
    );
  }
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{messages.focusTitle}</h1>
          <p className="text-sm text-muted-foreground">{query.sort ? messages.sortedHint : messages.focusHint}</p>
        </div>
        <form className="w-56" action="/entrar/foco" method="get">
          {query.sort ? <input type="hidden" name="sort" value={query.sort} /> : null}
          {query.dir ? <input type="hidden" name="dir" value={query.dir} /> : null}
          <label className="text-xs font-medium text-muted-foreground">
            {messages.clientLabel}
            <Input className="mt-1" name="q" defaultValue={query.q} placeholder={messages.searchPlaceholder} />
          </label>
        </form>
      </div>
      {loaded.items.length === 0 ? <p>{messages.emptyClients}</p> : <ClientTable items={loaded.items} query={query} />}
      <TablePager
        page={loaded.page}
        pageSize={loaded.pageSize}
        total={loaded.total}
        hrefForPage={(page) => clientHref({ ...query, page })}
      />
    </main>
  );
}

function isSession(value: SessionBody | string): value is SessionBody {
  return typeof value === "object" && value !== null && "profile" in value;
}

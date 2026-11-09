import { messages } from "../shared/messages/pt-BR";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TablePager({
  page,
  pageSize,
  total,
  hrefForPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefForPage: (page: number) => string;
}) {
  if (total === 0) {
    return null;
  }
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <nav className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-muted-foreground">
        {from}–{to} {messages.of} {total}
      </span>
      {page > 1 ? (
        <a className={cn(buttonVariants({ variant: "outline" }))} href={hrefForPage(page - 1)}>{messages.previousPage}</a>
      ) : null}
      {page * pageSize < total ? (
        <a className={cn(buttonVariants({ variant: "outline" }))} href={hrefForPage(page + 1)}>{messages.nextPage}</a>
      ) : null}
    </nav>
  );
}

export type LoadKind = "ok" | "session" | "missing" | "failure" | "focus";

export function kindFromStatus(status: number, code?: string): LoadKind {
  if (status === 401) {
    return "session";
  }
  if (status === 404) {
    return "missing";
  }
  if (code === "CLIENT_FOCUS_REQUIRED") {
    return "focus";
  }
  if (status >= 400) {
    return "failure";
  }
  return "ok";
}

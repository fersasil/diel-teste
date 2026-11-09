export function browserApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
}

export function serverApiBase(): string {
  return process.env.API_INTERNAL_URL ?? browserApiBase();
}

export function searchFragment(value?: string): string | undefined {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return undefined;
  }

  return trimmed.replace(/[%_\\]/g, "\\$&").slice(0, 80);
}

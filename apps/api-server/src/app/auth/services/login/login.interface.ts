import type { UserRecord } from "../../repositories/user.repository";

export type LoginResult =
  | { code: "INVALID_CREDENTIALS" }
  | { accessToken: string; profile: UserRecord["profile"]; clientId: string | null };

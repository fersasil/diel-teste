import { getPool } from "../../../infra/database/pg-pool";
import type { Profile } from "../../../shared/models/cadastro";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  profile: Profile;
  clientId: string | null;
  allowedStoreIds: string[];
  passwordHash: string;
}

export class UserRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await getPool().query(
      `SELECT id, name, email, profile, client_id, allowed_store_ids, password_hash
       FROM users WHERE email = $1`,
      [email],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      profile: row.profile,
      clientId: row.client_id,
      allowedStoreIds: row.allowed_store_ids,
      passwordHash: row.password_hash,
    };
  }
}

export function publicUser(user: UserRecord): Omit<UserRecord, "passwordHash"> {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profile: user.profile,
    clientId: user.clientId,
    allowedStoreIds: user.allowedStoreIds,
  };
}

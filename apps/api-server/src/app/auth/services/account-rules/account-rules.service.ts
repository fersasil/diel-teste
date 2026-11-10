import type { AccountShape } from "./account-rules.interface";

export type { AccountShape } from "./account-rules.interface";

export function isValidAccount(account: AccountShape): boolean {
  if (account.profile === "diel_operator") {
    return account.clientId === null && account.allowedStoreIds.length === 0;
  }

  if (account.profile === "network_manager") {
    return account.clientId !== null;
  }

  return account.clientId !== null && account.allowedStoreIds.length > 0;
}

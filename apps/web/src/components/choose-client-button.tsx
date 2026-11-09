"use client";

import { browserApiBase } from "../shared/api-base";
import { messages } from "../shared/messages/pt-BR";

export function ChooseClientButton({ clientId, name }: { clientId: string; name: string }) {
  async function choose() {
    const token = document.cookie.split("; ").find((item) => item.startsWith("accessToken="))?.slice("accessToken=".length) ?? "";
    const response = await fetch(`${browserApiBase()}/api/v1/auth/focus-client`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ clientId }),
    });
    if (response.ok) {
      window.location.href = "/";
    }
  }

  return (
    <button type="button" className="font-medium hover:text-primary hover:underline" onClick={() => void choose()}>
      {name}
    </button>
  );
}

"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import { browserApiBase } from "../../shared/api-base";
import { messages } from "../../shared/messages/pt-BR";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const controlClass =
  "h-full w-full rounded-[16px] border-0 bg-transparent px-4 pt-8 pb-1.5 text-sm leading-5 text-foreground shadow-none focus-visible:border-transparent focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0 md:text-sm";

export function LoginForm() {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  async function onSubmit(formData: FormData) {
    const typed = String(formData.get("email") ?? "");
    setEmail(typed);
    setError("");
    setPending(true);
    try {
      const response = await fetch(`${browserApiBase()}/api/v1/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: typed, password: formData.get("password") }),
      });
      const body = (await response.json()) as { accessToken?: string; profile?: string };
      if (!response.ok || !body.accessToken) {
        setError(messages.loginFailed);
        return;
      }
      document.cookie = `accessToken=${body.accessToken}; Path=/; SameSite=Lax`;
      window.location.href = body.profile === "diel_operator" ? "/entrar/foco" : "/";
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <LoginField
        id="login-email"
        label={messages.email}
        error={Boolean(error)}
        name="email"
        type="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <LoginField
        id="login-password"
        label={messages.password}
        error={Boolean(error)}
        name="password"
        type={passwordVisible ? "text" : "password"}
        autoComplete="current-password"
        trailing={
          <button
            type="button"
            className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#8E8E8E] hover:text-[#2B2F81]"
            aria-label={passwordVisible ? messages.hidePassword : messages.showPassword}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            {passwordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
      />
      {error ? (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="mt-1 h-12 rounded-xl text-base font-semibold" disabled={pending}>
        {messages.enter}
      </Button>
    </form>
  );
}

function LoginField({
  id,
  label,
  error,
  trailing,
  className,
  ...props
}: {
  id: string;
  label: string;
  error: boolean;
  trailing?: ReactNode;
} & ComponentProps<typeof Input>) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "login-field relative block h-16 rounded-[16px] border border-solid bg-white",
        error ? "border-destructive" : "border-[#D5D6F1]",
      )}
    >
      <Input
        id={id}
        placeholder={label}
        aria-invalid={error || undefined}
        className={cn(controlClass, trailing ? "pr-12" : null, className)}
        {...props}
      />
      <span className="login-label">{label}</span>
      {trailing}
    </label>
  );
}

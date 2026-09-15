import { FormEvent, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
}

export default function Login({
  onLogin,
}: {
  onLogin: (user: AuthUser) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => undefined);
      if (!response.ok)
        throw new Error(payload?.error?.message ?? "Unable to sign in.");
      onLogin(payload.user);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign in.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="selection">
      <form className="selection-card" onSubmit={submit}>
        <p className="eyebrow">TOKTockIT</p>
        <h1>Sign in</h1>
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}
        <label htmlFor="email">
          Email
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label htmlFor="password">
          Password
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <button className="primary wide" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}

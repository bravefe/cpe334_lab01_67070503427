import "./Login.css";
import { FormEvent, useState } from "react";
import { login } from "../../api/auth";
import { AuthUser } from "../../lib/auth";

export type { AuthUser } from "../../lib/auth";

export default function Login({
  onLogin,
}: {
  onLogin: (user: AuthUser) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");
    let valid = true;
    if (!email.trim()) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("Enter a valid email address.");
      valid = false;
    }
    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    }
    if (!valid) return;
    setBusy(true);

    try {
      onLogin(await login(email, password));
    } catch (requestError) {
      setShowPassword(false);
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
    <main className="selection login-screen">
      <form className="selection-card login-card" onSubmit={submit}>
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
            autoComplete="username"
          />
          {emailError && <small role="alert">{emailError}</small>}
        </label>

        <label htmlFor="password">
          Password
          <div className="password-input">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <button
              className="show-password"
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {passwordError && <small role="alert">{passwordError}</small>}
        </label>

        <button className="primary wide" disabled={busy}>
          {busy ? "Signing In…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

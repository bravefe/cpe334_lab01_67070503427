import { FormEvent, useState } from "react";
import { passwordRules } from "../lib/passwordRules";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
export default function ChangePassword({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const rules = passwordRules(newPassword);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!Object.values(rules).every(Boolean)) {
      setError("Password does not meet all requirements.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "TokTickIT",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = await response.json().catch(() => undefined);
      if (!response.ok)
        throw new Error(
          payload?.error?.message ?? "Unable to change password.",
        );
      onComplete();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to change password.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="selection">
      <form className="selection-card" onSubmit={submit}>
        <h1>Change password</h1>
        <p className="muted">Choose a new password before continuing.</p>
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}
        <label>
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>
        <label>
          New password
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </label>
        <ul>
          {Object.entries(rules).map(([rule, valid]) => (
            <li key={rule} className={valid ? "valid" : ""}>
              {rule}
            </li>
          ))}
        </ul>
        <label>
          Confirm password
          <input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </label>
        <button className="primary wide" disabled={busy}>
          {busy ? "Saving..." : "Save password"}
        </button>
      </form>
    </main>
  );
}

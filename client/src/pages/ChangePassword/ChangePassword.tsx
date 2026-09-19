import { FormEvent, useState } from "react";
import { changePassword } from "../../api/auth";
import { passwordRules } from "../../lib/passwordRules";
import "./ChangePassword.css";

export default function ChangePassword({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const rules = passwordRules(newPassword);
  const validPassword = Object.values(rules).every(Boolean);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirm;
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
      await changePassword(currentPassword, newPassword);
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
    <main className="selection change-password-screen">
      <form className="selection-card change-password-card" onSubmit={submit}>
        <h1>Change password</h1>
        <p className="muted">Choose a new password before continuing.</p>
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}
        <label>
          Current password
          <div className="password-input">
            <input
              type={showPasswords ? "text" : "password"}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            <button
              className="show-password"
              type="button"
              aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
              onClick={() => setShowPasswords((visible) => !visible)}
            >
              {showPasswords ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <label>
          New password
          <div className="password-input">
            <input
              type={showPasswords ? "text" : "password"}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <button
              className="show-password"
              type="button"
              aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
              onClick={() => setShowPasswords((visible) => !visible)}
            >
              {showPasswords ? "Hide" : "Show"}
            </button>
          </div>
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
          <div className="password-input">
            <input
              type={showPasswords ? "text" : "password"}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
            <button
              className="show-password"
              type="button"
              aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
              onClick={() => setShowPasswords((visible) => !visible)}
            >
              {showPasswords ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        {confirm && !passwordsMatch && (
          <small role="alert">Passwords do not match.</small>
        )}
        <button
          className="primary wide"
          disabled={
            busy || !validPassword || !passwordsMatch || !currentPassword
          }
        >
          {busy ? "Saving..." : "Save password"}
        </button>
      </form>
    </main>
  );
}

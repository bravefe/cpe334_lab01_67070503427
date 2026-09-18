import { FormEvent, useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { createUser, fetchUsers, resetUserPassword, updateUser } from "../../api/users";
import { ManagedUser, UserInput, UserRole } from "../../lib/user";
import TopBar from "../TopBar";
import "./UserManagement.css";

interface Props {
  currentUserId: number;
  user: { id: number; name: string; email: string; isActive: boolean };
  onLogout: () => void;
  onAdmin: () => void;
}

const emptyForm = (): UserInput & { initialPassword: string } => ({
  name: "", email: "", role: "REQUESTER", isActive: true, initialPassword: "",
});
const roleName = (role: string) => role.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());

export default function UserManagement({ currentUserId, user, onLogout, onAdmin }: Props) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"" | UserRole>("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState<ManagedUser | null | "create">(null);
  const [notice, setNotice] = useState("");

  const load = () => {
    setStatus("loading"); setLoadError("");
    fetchUsers({ q: search.trim() || undefined, role: role || undefined })
      .then(result => { setUsers(result.items); setStatus("ready"); })
      .catch(error => { setLoadError(error instanceof Error ? error.message : "Unable to load users."); setStatus("error"); });
  };
  useEffect(load, [search, role]);
  const close = () => setEditing(null);
  const saved = (message: string) => { close(); setNotice(message); load(); };

  return <>
    <TopBar requester={user} role="ADMINISTRATOR" onChange={onLogout} onAdmin={onAdmin} />
    <main className="page users-page">
      <header className="page-header"><div><h1>Users</h1><p className="muted">Create and manage user accounts.</p></div>
        <button className="primary" type="button" onClick={() => setEditing("create")}>Create User</button></header>
      {notice && <div className="user-toast" role="status">{notice}</div>}
      <section className="users-controls">
        <label>Search users<input aria-label="Search users" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" /></label>
        <label>Role<select aria-label="Role filter" value={role} onChange={e => setRole(e.target.value as "" | UserRole)}><option value="">All roles</option><Roles /></select></label>
      </section>
      {status === "loading" && <section className="ticket-panel users-loading">Loading users...</section>}
      {status === "error" && <section className="empty"><h2 className="error-message">Unable to load users.</h2><p className="muted">{loadError}</p><button type="button" onClick={load}>Retry</button></section>}
      {status === "ready" && users.length === 0 && <section className="empty"><h2>No users match your search.</h2><button type="button" onClick={() => { setSearch(""); setRole(""); }}>Clear search</button></section>}
      {status === "ready" && users.length > 0 && <section className="ticket-panel users-table-wrap"><table><thead><tr><th>Name</th><th>Role</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{users.map(item => <tr key={item.id}><td><strong>{item.name}</strong><span className="user-email">{item.email}</span></td><td><span className={`user-role role-${item.role.toLowerCase()}`}>{roleName(item.role)}</span></td><td><span className={`user-status ${item.isActive ? "active" : "inactive"}`}>{item.isActive ? "Active" : "Inactive"}</span></td><td><button type="button" onClick={() => setEditing(item)}>Edit</button></td></tr>)}</tbody></table></section>}
    </main>
    {editing && <UserPanel user={editing === "create" ? null : editing} currentUserId={currentUserId} onClose={close} onSaved={saved} />}
  </>;
}

function Roles() { return <><option value="REQUESTER">Requester</option><option value="IT_STAFF">IT Staff</option><option value="ADMINISTRATOR">Administrator</option></>; }

function UserPanel({ user, currentUserId, onClose, onSaved }: { user: ManagedUser | null; currentUserId: number; onClose: () => void; onSaved: (message: string) => void }) {
  const create = !user;
  const [form, setForm] = useState<UserInput & { initialPassword: string }>(user ? { ...user, initialPassword: "" } : emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflict, setConflict] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const self = user?.id === currentUserId;
  const change = (key: keyof typeof form, value: string | boolean) => setForm(current => ({ ...current, [key]: value }));
  const validate = (password = create) => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Full name is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (!form.role) next.role = "Role is required.";
    if (password && form.initialPassword.length < 8) next.initialPassword = "Password must be at least 8 characters.";
    setErrors(next); return Object.keys(next).length === 0;
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setConflict(""); if (!validate()) return; setSaving(true);
    try { if (create) await createUser(form); else await updateUser(user.id, form); onSaved(create ? "User created." : "User updated."); }
    catch (error) { const api = error as ApiError; if (api.code === "DUPLICATE_EMAIL") setErrors({ email: api.message }); else setConflict(api.message); }
    finally { setSaving(false); }
  };
  const reset = async () => {
    setConflict(""); if (!validate(true)) return; setResetting(true);
    try { await resetUserPassword(user!.id, form.initialPassword); onSaved("Password reset — user must change it at next login."); }
    catch (error) { setErrors({ initialPassword: error instanceof Error ? error.message : "Unable to reset password." }); }
    finally { setResetting(false); }
  };
  return <div className="user-overlay" role="presentation"><aside className="user-panel" aria-label={create ? "Create New User" : "Edit User"}><header><h2>{create ? "Create New User" : "Edit User"}</h2><button type="button" aria-label="Close" onClick={onClose}>×</button></header><form onSubmit={submit} noValidate>
    <Field label="Full Name" error={errors.name}><input value={form.name} onChange={e => change("name", e.target.value)} /></Field>
    <Field label="Email Address" error={errors.email}><input type="email" value={form.email} onChange={e => change("email", e.target.value)} /></Field>
    <Field label="Role" error={errors.role}><select value={form.role} onChange={e => change("role", e.target.value)}><Roles /></select></Field>
    <label className="active-control" title={self ? "You can't deactivate your own account" : undefined}><input aria-label="Active" type="checkbox" checked={form.isActive} disabled={self} onChange={e => change("isActive", e.target.checked)} /> Active {self && <span className="muted">You can't deactivate your own account</span>}</label>
    {create && <><Field label="Initial Password" error={errors.initialPassword}><input type="password" value={form.initialPassword} onChange={e => change("initialPassword", e.target.value)} /></Field><p className="password-note">The user will sign in with this password and must change it immediately.</p></>}
    {conflict && <p className="panel-conflict" role="alert">{conflict}</p>}
    <div className="panel-actions"><button className="primary" disabled={saving}>{saving ? "Saving..." : "Save User"}</button><button type="button" onClick={onClose}>Cancel</button></div>
  </form>{!create && <section className="reset-section"><h3>Reset Password</h3><Field label="New Initial Password" error={errors.initialPassword}><input type="password" value={form.initialPassword} onChange={e => change("initialPassword", e.target.value)} /></Field><button type="button" disabled={resetting} onClick={reset}>{resetting ? "Resetting..." : "Reset Password"}</button></section>}</aside></div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label className="user-field">{label}{children}{error && <span className="field-error" role="alert">{error}</span>}</label>; }

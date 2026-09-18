import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import UserManagement from "../../src/pages/UserManagement/UserManagement";

const users = [{ id: 1, name: "Elrond Admin", email: "elrond@example.com", role: "ADMINISTRATOR", isActive: true }, { id: 2, name: "Arwen Staff", email: "arwen@example.com", role: "IT_STAFF", isActive: true }];
const response = (body: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
function renderPage() { return render(<UserManagement currentUserId={1} user={{ id: 1, name: "Elrond Admin", email: "elrond@example.com", isActive: true }} onLogout={vi.fn()} onAdmin={vi.fn()} />); }

describe("Lab 3 user management", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
  it("UI-17: validates required create fields before submitting", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ items: users })));
    const user = userEvent.setup(); renderPage(); await screen.findByText("Elrond Admin");
    await user.click(screen.getByRole("button", { name: "Create User" }));
    await user.click(screen.getByRole("button", { name: "Save User" }));
    expect(screen.getByText("Full name is required.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
  });
  it("UI-18: shows duplicate email error below Email Address", async () => {
    const fetchMock = vi.fn().mockImplementation((_input: RequestInfo, init?: RequestInit) => Promise.resolve(init?.method === "POST" ? response({ error: { code: "DUPLICATE_EMAIL", message: "A user with this email already exists." } }, 409) : response({ items: users })));
    vi.stubGlobal("fetch", fetchMock); const user = userEvent.setup(); renderPage(); await screen.findByText("Elrond Admin");
    await user.click(screen.getByRole("button", { name: "Create User" }));
    const inputs = screen.getAllByRole("textbox"); await user.type(inputs[0], "New Person"); await user.type(inputs[1], "elrond@example.com"); await user.type(screen.getByLabelText("Initial Password"), "Password123!"); await user.click(screen.getByRole("button", { name: "Save User" }));
    expect(await screen.findByText("A user with this email already exists.")).toBeInTheDocument();
  });
  it("UI-19: disables the current administrator Active control", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ items: users }))); const user = userEvent.setup(); renderPage(); await screen.findByText("Elrond Admin"); await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    expect(screen.getByLabelText("Active")).toBeDisabled();
    expect(screen.getByText("You can't deactivate your own account")).toBeInTheDocument();
  });
  it("UI-20: prefills the edit panel", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ items: users }))); const user = userEvent.setup(); renderPage(); await screen.findByText("Arwen Staff"); await user.click(screen.getAllByRole("button", { name: "Edit" })[1]);
    expect(screen.getByDisplayValue("Arwen Staff")).toBeInTheDocument(); expect(screen.getByDisplayValue("arwen@example.com")).toBeInTheDocument(); expect(screen.getByDisplayValue("IT_STAFF")).toBeInTheDocument();
  });
  it("UI-29: keeps last-admin conflict in the open panel", async () => {
    const fetchMock = vi.fn().mockImplementation((_input: RequestInfo, init?: RequestInit) => Promise.resolve(init?.method === "PATCH" ? response({ error: { code: "LAST_ADMIN", message: "At least one active administrator is required." } }, 409) : response({ items: users })));
    vi.stubGlobal("fetch", fetchMock); const user = userEvent.setup(); renderPage(); await screen.findByText("Elrond Admin"); await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    await user.selectOptions(screen.getByLabelText("Role"), "REQUESTER"); await user.click(screen.getByRole("button", { name: "Save User" }));
    expect(await screen.findByText("At least one active administrator is required.")).toBeInTheDocument(); expect(screen.getByRole("heading", { name: "Edit User" })).toBeInTheDocument();
  });
});

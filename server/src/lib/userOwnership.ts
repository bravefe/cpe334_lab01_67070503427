export function isTicketOwnerEligible(user: {
  role: string;
  isActive: boolean;
}): boolean {
  return (
    user.isActive && (user.role === "IT_STAFF" || user.role === "ADMINISTRATOR")
  );
}

/** True when changing this active administrator would leave none active. */
export function wouldRemoveLastActiveAdministrator(
  users: { id: number; role: string; isActive: boolean }[],
  userId: number,
  next: { role?: string; isActive?: boolean },
): boolean {
  const current = users.find((user) => user.id === userId);
  if (!current || current.role !== "ADMINISTRATOR" || !current.isActive) {
    return false;
  }
  const remainsAdministrator =
    (next.role ?? current.role) === "ADMINISTRATOR" &&
    (next.isActive ?? current.isActive);
  return !remainsAdministrator && users.filter(
    (user) => user.role === "ADMINISTRATOR" && user.isActive,
  ).length === 1;
}

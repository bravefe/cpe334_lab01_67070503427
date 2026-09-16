export function isTicketOwnerEligible(user: {
  role: string;
  isActive: boolean;
}): boolean {
  return (
    user.isActive && (user.role === "IT_STAFF" || user.role === "ADMINISTRATOR")
  );
}

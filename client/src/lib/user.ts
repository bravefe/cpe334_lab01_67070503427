export type UserRole = "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";

export interface ManagedUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword?: boolean;
}

export interface UserInput {
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

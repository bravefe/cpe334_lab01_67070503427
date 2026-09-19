import bcrypt from "bcryptjs";

export const BCRYPT_COST = 12;

export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length < 8)
    return "Password must be at least 8 characters long.";
  if (!/[A-Z]/.test(password))
    return "Password must contain an uppercase letter.";
  if (!/[a-z]/.test(password))
    return "Password must contain a lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain a number.";
  if (!/[^A-Za-z0-9]/.test(password))
    return "Password must contain a special character.";
  return null;
}

export function passwordRules(password: string) {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export const hashPassword = (password: string) =>
  bcrypt.hash(password, BCRYPT_COST);
export const comparePassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash);

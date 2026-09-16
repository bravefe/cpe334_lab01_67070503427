import { getPrisma } from "../prisma.js";

export async function findUserByEmail(email: string) {
  return getPrisma().user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
}

export async function findUserById(id: number) {
  return getPrisma().user.findUnique({ where: { id } });
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  return getPrisma().user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: false,
    },
  });
}

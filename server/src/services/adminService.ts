// services/adminService.ts  (add imports + function)
import { getPrisma } from "../prisma.js";
import { Role } from "@prisma/client";
import { ROLE_LABELS, type AdminDashboard } from "../lib/dashboard.js";
import { getStaffDashboardService } from "./staffService.js";

export async function getAdminDashboardService(
  adminUserId: number,
): Promise<AdminDashboard> {
  const prisma = getPrisma();

  const [staff, total, active, roleGroups] = await Promise.all([
    getStaffDashboardService(adminUserId),
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
  ]);

  const roleCounts = new Map(roleGroups.map((r) => [r.role, r._count._all]));

  return {
    ...staff,
    userCounts: {
      total,
      active,
      byRole: (Object.values(Role) as Role[]).map((role) => ({
        role: ROLE_LABELS[role],
        count: roleCounts.get(role) ?? 0,
      })),
    },
  };
}

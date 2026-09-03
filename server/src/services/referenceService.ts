import { getPrisma } from "../prisma.js";

export async function getCategoriesService() {
  return getPrisma().category.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });
}

export async function getRelatedSystemsService() {
  return getPrisma().relatedSystem.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });
}

export async function getPrioritiesService() {
  return getPrisma().priority.findMany({
    select: {
      id: true,
      name: true,
      sortOrder: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });
}

export async function getStatusesService() {
  return getPrisma().status.findMany({
    select: {
      id: true,
      name: true,
      isDefault: true,
    },
    orderBy: {
      id: "asc",
    },
  });
}

export async function getDevRequestersService() {
  return getPrisma().devRequester.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}
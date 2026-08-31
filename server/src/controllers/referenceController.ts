import { Request, Response } from "express";
import {
  getCategoriesService,
  getPrioritiesService,
  getRelatedSystemsService,
  getStatusesService,
  getDevRequestersService,
} from "../services/referenceService.js";

export async function getCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await getCategoriesService();
    res.status(200).json({ data: categories });
  } catch (_error) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch categories" } });
  }
}

export async function getRelatedSystems(_req: Request, res: Response): Promise<void> {
  try {
    const systems = await getRelatedSystemsService();
    res.status(200).json({ data: systems });
  } catch (_error) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch related systems" } });
  }
}

export async function getPriorities(_req: Request, res: Response): Promise<void> {
  try {
    const priorities = await getPrioritiesService();
    res.status(200).json({ data: priorities });
  } catch (_error) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch priorities" } });
  }
}

export async function getStatuses(_req: Request, res: Response): Promise<void> {
  try {
    const statuses = await getStatusesService();
    res.status(200).json({ data: statuses });
  } catch (_error) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch statuses" } });
  }
}

export async function getDevRequesters(_req: Request, res: Response): Promise<void> {
  try {
    const requesters = await getDevRequestersService();
    res.status(200).json({ data: requesters });
  } catch (_error) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch requesters" } });
  }
}
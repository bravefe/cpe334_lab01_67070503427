import { Request, Response } from "express";
import {
  getCategoriesService,
  getPrioritiesService,
  getStatusesService,
  getDevRequestersService,
} from "../services/referenceService.js";

export async function getCategories(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const categories = await getCategoriesService();

    res.status(200).json(categories);
  } catch (_error) {
    res.status(500).json({
      error: "Failed to fetch categories",
    });
  }
}

export async function getPriorities(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const priorities = await getPrioritiesService();

    res.status(200).json(priorities);
  } catch (_error) {
    res.status(500).json({
      error: "Failed to fetch priorities",
    });
  }
}

export async function getStatuses(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const statuses = await getStatusesService();

    res.status(200).json(statuses);
  } catch (_error) {
    res.status(500).json({
      error: "Failed to fetch statuses",
    });
  }
}

export async function getDevRequesters(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const requesters = await getDevRequestersService();

    res.status(200).json(requesters);
  } catch (_error) {
    res.status(500).json({
      error: "Failed to fetch requesters",
    });
  }
}
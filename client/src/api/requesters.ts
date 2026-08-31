import { list } from "./client";
import { Requester } from "../lib/requester";

export const fetchRequesters = () => list<Requester>("/api/dev-requesters");

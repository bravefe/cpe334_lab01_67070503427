import express from "express";
import cors from "cors";

import healthRouter from "./routes/health.js";
import referencesRouter from "./routes/references.js";
import ticketsRouter from "./routes/tickets.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", referencesRouter);
app.use("/api", ticketsRouter);

export default app;
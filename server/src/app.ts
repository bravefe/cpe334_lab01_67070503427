import express from "express";
import cors from "cors";

import healthRouter from "./routes/health.js";
import referencesRouter from "./routes/referenceRoute.js";
import ticketsRouter from "./routes/ticketRoute.js";
import attachmentRouter from "./routes/attachmentRoute.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", referencesRouter);
app.use("/api", ticketsRouter);
app.use("/api", attachmentRouter);

export default app;
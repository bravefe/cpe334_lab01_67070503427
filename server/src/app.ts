import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import healthRouter from "./routes/health.js";
import referencesRouter from "./routes/referenceRoute.js";
import ticketsRouter from "./routes/ticketRoute.js";
import attachmentRouter from "./routes/attachmentRoute.js";
import authRouter from "./routes/authRoute.js";
import {
  authenticate,
  requireCompletedPasswordChange,
  requireCsrf,
} from "./middleware/authentication.js";
import staffRouter from "./routes/staffRoute.js";
import adminRouter from "./routes/adminRoute.js";

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api", healthRouter);
app.use("/api", authRouter);
app.use(requireCsrf);
app.use(authenticate);
app.use(requireCompletedPasswordChange);
app.use("/api", referencesRouter);
app.use("/api", ticketsRouter);
app.use("/api", attachmentRouter);
app.use("/api", staffRouter);
app.use("/api", adminRouter);

export default app;

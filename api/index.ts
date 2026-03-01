import type { IncomingMessage, ServerResponse } from "http";
import { handle } from "@hono/node-server/vercel";
import { initDb } from "../src/db.js";
import { app } from "../src/app.js";

let initialized = false;
const honoHandler = handle(app);

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  if (!initialized) {
    await initDb();
    initialized = true;
  }
  return honoHandler(req, res);
}

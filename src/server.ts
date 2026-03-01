import { serveStatic } from "hono/bun";
import { app } from "./app.js";
import { initDb } from "./db.js";

const PORT = parseInt(process.env.PORT || "3456");

await initDb();

// 静的ファイル配信 (ビルド済みweb/)
app.use("/*", serveStatic({ root: "./web/dist" }));
app.get("/*", serveStatic({ root: "./web/dist", path: "index.html" }));

console.log(`Joyfit Tracker API サーバー起動: http://localhost:${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
};

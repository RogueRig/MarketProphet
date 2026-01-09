import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Needed because __dirname is not available in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve built frontend
const publicDir = path.join(__dirname, "../dist/public");
app.use(express.static(publicDir));

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

export default app;
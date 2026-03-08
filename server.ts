import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import crypto from "crypto";
import cors from "cors";
import bodyParser from "body-parser";

const PROJECTS_FILE = path.resolve(process.cwd(), "projects.json");
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || process.env["\uFEFFADMIN_PASSWORD"] || "").trim();
const AUTH_TOKENS = new Map<string, number>();
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || !AUTH_TOKENS.has(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const expires = AUTH_TOKENS.get(token)!;
  if (Date.now() > expires) {
    AUTH_TOKENS.delete(token);
    return res.status(401).json({ error: "Session expired" });
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json({ limit: "15mb" }));

  // Auth login
  app.post("/api/auth/login", async (req, res) => {
    const raw = req.body?.password;
    const password = typeof raw === "string" ? raw.trim() : "";
    if (!ADMIN_PASSWORD) {
      return res.status(503).json({ error: "Admin not configured. Set ADMIN_PASSWORD in .env" });
    }
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid password" });
    }
    const token = crypto.randomBytes(32).toString("hex");
    AUTH_TOKENS.set(token, Date.now() + TOKEN_TTL_MS);
    res.json({ token });
  });

  // Projects API - JSON file (used when client doesn't use Firestore)
  app.get("/api/projects", async (req, res) => {
    try {
      const data = await fs.readFile(PROJECTS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read projects" });
    }
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      const { title, category, image, niche, description } = req.body;
      const project = { title, category, image, niche, description };

      const data = await fs.readFile(PROJECTS_FILE, "utf-8");
      const projects = JSON.parse(data);
      const newProject = { ...project, id: Date.now().toString() };
      projects.push(newProject);
      await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));
      res.status(201).json(newProject);
    } catch (error) {
      res.status(500).json({ error: "Failed to save project" });
    }
  });

  app.delete("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const data = await fs.readFile(PROJECTS_FILE, "utf-8");
      let projects = JSON.parse(data);
      projects = projects.filter((p: any) => p.id !== id);
      await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));
      res.status(200).json({ message: "Project deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), "dist")));
    app.get("/{*path}", (req, res) => {
      res.sendFile(path.resolve(process.cwd(), "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("Projects: API (JSON) or client Firestore when VITE_FIREBASE_API_KEY is set");
  });
}

startServer();

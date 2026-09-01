import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import cors from "cors";
import bodyParser from "body-parser";

const PROJECTS_FILE = path.resolve(process.cwd(), "projects.json");
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || process.env["\uFEFFADMIN_PASSWORD"] || "").trim();

function sameProjectId(a: unknown, b: unknown): boolean {
  return String(a) === String(b);
}

async function readProjects(): Promise<any[]> {
  const data = await fs.readFile(PROJECTS_FILE, "utf-8");
  return JSON.parse(data);
}

async function writeProjects(projects: unknown): Promise<void> {
  const payload = JSON.stringify(projects, null, 2);
  const tmp = PROJECTS_FILE + ".tmp";
  await fs.writeFile(tmp, payload, "utf-8");
  await fs.copyFile(tmp, PROJECTS_FILE);
  await fs.unlink(tmp).catch(() => undefined);
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json({ limit: "100mb" }));

  // Auth login - returns password as token so auth survives server restarts (Render sleep)
  app.post("/api/auth/login", async (req, res) => {
    const raw = req.body?.password;
    const password = typeof raw === "string" ? raw.trim() : "";
    if (!ADMIN_PASSWORD) {
      return res.status(503).json({ error: "Admin not configured. Set ADMIN_PASSWORD in .env" });
    }
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid password" });
    }
    res.json({ token: ADMIN_PASSWORD });
  });

  // Projects API - JSON file (used when client doesn't use Firestore)
  app.get("/api/projects", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      const projects = await readProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to read projects" });
    }
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      const { title, category, image, images, niche, description } = req.body;
      const project = {
        title,
        category,
        image,
        ...(Array.isArray(images) && images.length > 0 ? { images } : {}),
        niche,
        description,
      };

      const projects = await readProjects();
      const newProject = { ...project, id: Date.now().toString() };
      projects.push(newProject);
      await writeProjects(projects);
      res.status(201).json(newProject);
    } catch (error) {
      console.error("POST /api/projects failed:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to save project",
      });
    }
  });

  app.put("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, category, image, images, niche, description } = req.body;

      const projects = await readProjects();
      const index = projects.findIndex((p: { id: string | number }) => sameProjectId(p.id, id));
      if (index === -1) {
        return res.status(404).json({ error: "Project not found" });
      }

      const updated: Record<string, unknown> = {
        ...projects[index],
        title,
        category,
        image,
        niche,
        description,
      };
      if (Array.isArray(images) && images.length > 0) {
        updated.images = images;
      } else {
        delete updated.images;
      }
      projects[index] = updated;
      await writeProjects(projects);
      res.status(200).json(updated);
    } catch (error) {
      console.error("PUT /api/projects failed:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to update project",
      });
    }
  });

  app.delete("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const projects = (await readProjects()).filter((p: any) => !sameProjectId(p.id, id));
      await writeProjects(projects);
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

  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err?.type === "entity.too.large" || err?.status === 413) {
      return res.status(413).json({
        error: "Upload too large. Compress images or use Firebase Storage / image URLs.",
      });
    }
    console.error("Unhandled server error:", err);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: err?.message || "Server error" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("Projects: API (JSON) or client Firestore when VITE_FIREBASE_API_KEY is set");
  });
}

startServer();

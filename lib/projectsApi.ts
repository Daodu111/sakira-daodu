import {
  useFirestore,
  firestoreGetProjects,
  firestoreAddProject,
  firestoreUpdateProject,
  firestoreDeleteProject,
  ProjectDoc,
} from "./firebaseClient";

export type Project = ProjectDoc;

export function useFirestoreForProjects(): boolean {
  return useFirestore();
}

async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body?.error && typeof body.error === "string") return body.error;
  } catch {
    /* ignore */
  }
  if (res.status === 413) {
    return "Upload too large. Use fewer/smaller images, or enable Firebase Storage.";
  }
  return `${fallback} (${res.status})`;
}

export async function fetchProjects(): Promise<Project[]> {
  if (useFirestore()) {
    return firestoreGetProjects();
  }
  const res = await fetch(`/api/projects?t=${Date.now()}`, {
    cache: "no-store",
    headers: { "Cache-Control": "no-store" },
  });
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export async function addProject(
  project: Omit<Project, "id">,
  authToken?: string | null
): Promise<Project> {
  if (useFirestore()) {
    const added = await firestoreAddProject(project);
    if (!added) throw new Error("Failed to add project");
    return added;
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch("/api/projects", {
    method: "POST",
    headers,
    body: JSON.stringify(project),
  });
  if (res.status === 401) throw { status: 401 };
  if (!res.ok) throw new Error(await readApiError(res, "Failed to add project"));
  return res.json();
}

export async function updateProject(
  id: string,
  project: Omit<Project, "id">,
  authToken?: string | null
): Promise<Project> {
  if (useFirestore()) {
    const updated = await firestoreUpdateProject(id, project);
    if (!updated) throw new Error("Failed to update project");
    return updated;
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(`/api/projects/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(project),
  });
  if (res.status === 401) throw { status: 401 };
  if (!res.ok) throw new Error(await readApiError(res, "Failed to update project"));
  return res.json();
}

export async function deleteProject(id: string, authToken?: string | null): Promise<boolean> {
  if (useFirestore()) {
    return firestoreDeleteProject(id);
  }
  const headers: Record<string, string> = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(`/api/projects/${id}`, { method: "DELETE", headers });
  if (res.status === 401) throw { status: 401 };
  return res.ok;
}

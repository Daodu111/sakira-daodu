import React, { useState, useEffect, useRef } from 'react';
import { Niche } from '../types';
import {
  Project,
  fetchProjects as apiFetchProjects,
  addProject as apiAddProject,
  updateProject as apiUpdateProject,
  deleteProject as apiDeleteProject,
} from '../lib/projectsApi';
import { useFirebaseStorage, uploadImageToStorage } from '../lib/firebaseClient';
import { getProjectImages, buildMediaFields } from '../lib/projectMedia';
import { compressImageFile, fileToDataUrl, estimatePayloadBytes } from '../lib/imageCompress';
import AdminLogin from './AdminLogin';
import ProjectVideo from './ProjectVideo';
import ImageCarousel from './ImageCarousel';
import { ArrowLeft, Plus, Trash2, Save, X, Image as ImageIcon, Film, Upload, LogOut, Pencil } from 'lucide-react';

const AUTH_KEY = 'admin_token';
/** Soft limit before we warn — base64 in JSON gets large quickly. */
const PAYLOAD_WARN_BYTES = 12 * 1024 * 1024;

type ProjectForm = Partial<Project> & { mediaUrls: string[] };

const emptyForm = (): ProjectForm => ({
  title: '',
  category: '',
  image: '',
  images: [],
  mediaUrls: [],
  niche: Niche.DESIGN,
  description: '',
});

/** Seed/demo assets from the original mock projects — replace these when the user uploads real files. */
const isMockAssetUrl = (url: string) =>
  /picsum\.photos|assets\.mixkit\.co/i.test(url);

const mergeUploadedMedia = (prev: string[], incoming: string[]): string[] => {
  if (prev.length > 0 && prev.every(isMockAssetUrl)) return incoming;
  return [...prev, ...incoming];
};

interface AdminProps {
  onBack: () => void;
}

const Admin: React.FC<AdminProps> = ({ onBack }) => {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(AUTH_KEY));
  const [projects, setProjects] = useState<Project[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProjectForm>(emptyForm());

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await apiFetchProjects();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const mediaUrls = form.mediaUrls || [];

  const patchForm = (patch: Partial<ProjectForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const setMediaUrls = (updater: string[] | ((prev: string[]) => string[])) => {
    setForm((prev) => {
      const current = prev.mediaUrls || [];
      const next = typeof updater === 'function' ? updater(current) : updater;
      const { image, images } = buildMediaFields(next);
      return { ...prev, mediaUrls: next, image, images };
    });
  };

  const readFileAsDataUrl = (file: File): Promise<string> => fileToDataUrl(file);

  /** Prefer Firebase Storage URLs; fall back to compressed base64 for local JSON. */
  const persistFile = async (file: File): Promise<string> => {
    const prepared =
      file.type.startsWith('image/') ? await compressImageFile(file) : file;

    if (useFirebaseStorage()) {
      try {
        return await uploadImageToStorage(prepared);
      } catch (err) {
        console.warn('Firebase Storage upload failed, using compressed data URL:', err);
      }
    }

    return readFileAsDataUrl(prepared);
  };

  /** Shrink already-attached data: URLs so Update isn't rejected as too large. */
  const optimizeMediaUrl = async (url: string): Promise<string> => {
    if (!url.startsWith('data:image/') || url.length < 250_000) return url;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], `image-${Date.now()}.jpg`, {
        type: blob.type || 'image/jpeg',
      });
      return persistFile(file);
    } catch (err) {
      console.warn('Could not recompress media URL:', err);
      return url;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    const files = Array.from(fileList);

    setUploading(true);
    try {
      const isDesign = form.niche === Niche.DESIGN;
      const toProcess = isDesign ? files : files.slice(0, 1);
      const uploaded: string[] = [];

      for (const file of toProcess) {
        uploaded.push(await persistFile(file));
      }

      if (isDesign) {
        setMediaUrls((prev) => mergeUploadedMedia(prev, uploaded));
      } else {
        setMediaUrls(uploaded);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      alert(
        'Upload failed. Try smaller images, paste image URLs, or check Firebase Storage rules in the Firebase Console.'
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = () => {
    const url = urlDraft.trim();
    if (!url) return;
    if (form.niche === Niche.VIDEO) {
      setMediaUrls([url]);
    } else {
      setMediaUrls((prev) => mergeUploadedMedia(prev, [url]));
    }
    setUrlDraft('');
  };

  const removeMediaAt = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLoginSuccess = (authToken: string) => {
    sessionStorage.setItem(AUTH_KEY, authToken);
    setToken(authToken);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setToken(null);
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setUrlDraft('');
    setIsFormOpen(true);
  };

  const openEditForm = (project: Project) => {
    const urls = getProjectImages(project);
    setEditingId(project.id);
    setForm({
      title: project.title,
      category: project.category,
      image: project.image,
      images: urls,
      mediaUrls: urls,
      niche: project.niche as Niche,
      description: project.description,
    });
    setUrlDraft('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setUrlDraft('');
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrls.length) {
      alert('Please add at least one image or video.');
      return;
    }

    setUploading(true);
    try {
      const optimized: string[] = [];
      for (const url of mediaUrls) {
        optimized.push(await optimizeMediaUrl(url));
      }
      setMediaUrls(optimized);

      const payloadSize = estimatePayloadBytes(optimized);
      if (payloadSize > PAYLOAD_WARN_BYTES && !useFirebaseStorage()) {
        const mb = (payloadSize / (1024 * 1024)).toFixed(1);
        const proceed = confirm(
          `These images are still about ${mb} MB after compression, which may fail to save.\n\n` +
            `Prefer hosted image URLs (Imgur/Cloudinary) for large carousels.\n\n` +
            `Try saving anyway?`
        );
        if (!proceed) return;
      }

      const { image, images } = buildMediaFields(optimized);
      const payload: Omit<Project, 'id'> = {
        title: form.title!,
        category: form.category!,
        image,
        niche: form.niche!,
        description: form.description!,
      };
      if (form.niche === Niche.DESIGN) {
        payload.images = images;
      }

      let saved: Project;
      if (editingId) {
        saved = await apiUpdateProject(editingId, payload, token);
      } else {
        saved = await apiAddProject(payload, token);
      }

      try {
        const latest = await apiFetchProjects();
        const exists = latest.some((p) => String(p.id) === String(saved.id));
        setProjects(
          exists
            ? latest.map((p) => (String(p.id) === String(saved.id) ? saved : p))
            : [...latest, saved]
        );
      } catch {
        setProjects((prev) => {
          if (editingId) {
            return prev.map((p) => (String(p.id) === String(editingId) ? { ...p, ...saved } : p));
          }
          return prev.some((p) => String(p.id) === String(saved.id)) ? prev : [...prev, saved];
        });
      }
      closeForm();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && err.status === 401) {
        handleLogout();
        return;
      }
      console.error('Error saving project:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to save project. Please try again.';
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await apiDeleteProject(id, token);
      await fetchProjects();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && err.status === 401) {
        handleLogout();
        return;
      }
      console.error('Error deleting project:', err);
    }
  };

  if (!token) {
    return <AdminLogin onSuccess={handleLoginSuccess} />;
  }

  const isDesign = form.niche === Niche.DESIGN;

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> Back to Portfolio
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </div>
          <h1 className="text-3xl font-serif font-bold">
            Project <span className="text-orange-500">Management</span>
          </h1>
          <button
            onClick={openAddForm}
            className="bg-orange-500 text-black px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-orange-600 transition-all"
          >
            <Plus className="w-5 h-5" /> Add New Project
          </button>
        </div>

        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 dark:bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="glass w-full max-w-2xl rounded-3xl p-8 border border-black/10 dark:border-white/10 my-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-serif font-bold">
                  {editingId ? 'Edit' : 'Add New'} <span className="text-orange-500">Project</span>
                </h2>
                <button onClick={closeForm} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveProject} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Title</label>
                    <input
                      required
                      type="text"
                      value={form.title}
                      onChange={(e) => patchForm({ title: e.target.value })}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all"
                      placeholder="Project Title"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Category</label>
                    <input
                      required
                      type="text"
                      value={form.category}
                      onChange={(e) => patchForm({ category: e.target.value })}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all"
                      placeholder="e.g. Logo Design"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Niche</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => patchForm({ niche: Niche.DESIGN })}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                        form.niche === Niche.DESIGN
                          ? 'bg-orange-500 text-black border-orange-500'
                          : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" /> Graphic Design
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Video projects keep a single media item
                        const first = mediaUrls[0] ? [mediaUrls[0]] : [];
                        setForm((prev) => ({
                          ...prev,
                          niche: Niche.VIDEO,
                          mediaUrls: first,
                          ...buildMediaFields(first),
                        }));
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                        form.niche === Niche.VIDEO
                          ? 'bg-orange-500 text-black border-orange-500'
                          : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <Film className="w-4 h-4" /> Video Editing
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    {isDesign ? 'Design Assets' : 'Video Asset'}
                    {isDesign && (
                      <span className="normal-case font-medium tracking-normal text-gray-400 ml-2">
                        (multiple images → carousel)
                      </span>
                    )}
                  </label>
                  {useFirebaseStorage() ? (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      Images are uploaded to Firebase Storage (compressed). Select several at once for a carousel.
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      Images are compressed and saved locally (Firebase Storage is off). Select several at once for a carousel.
                    </p>
                  )}

                  <div className="flex gap-4">
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={urlDraft}
                        onChange={(e) => setUrlDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddUrl();
                          }
                        }}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all"
                        placeholder={
                          isDesign
                            ? 'Image URL (https://...) then Add'
                            : 'Video URL — MP4, YouTube, or Vimeo'
                        }
                      />
                      <button
                        type="button"
                        onClick={handleAddUrl}
                        disabled={!urlDraft.trim()}
                        className="shrink-0 px-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm font-bold hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-40"
                      >
                        Add
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept={isDesign ? 'image/*' : 'video/*'}
                        multiple={isDesign}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="h-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-6 hover:bg-black/10 dark:hover:bg-white/10 transition-all flex items-center gap-2 text-sm font-bold"
                      >
                        {uploading ? (
                          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Upload
                      </button>
                    </div>
                  </div>

                  {mediaUrls.length > 0 && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      {mediaUrls.map((url, i) => (
                        <div
                          key={`${i}-${url.slice(0, 40)}`}
                          className="relative w-20 h-20 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 group/thumb"
                        >
                          {form.niche === Niche.VIDEO ? (
                            <div className="w-full h-full flex items-center justify-center text-orange-500">
                              <Film className="w-6 h-6" />
                            </div>
                          ) : (
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => removeMediaAt(i)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-90 hover:opacity-100"
                            aria-label="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {isDesign && mediaUrls.length > 1 && (
                            <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-black/60 text-white px-1 rounded">
                              {i + 1}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {mediaUrls.length > 0 && (
                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">
                      {mediaUrls.length} file{mediaUrls.length > 1 ? 's' : ''} attached
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={form.description}
                    onChange={(e) => patchForm({ description: e.target.value })}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all resize-none"
                    placeholder="Brief description of the project..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {uploading ? 'Saving…' : editingId ? 'Update Project' : 'Save Project'}
                </button>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => {
              const imgs = getProjectImages(project);
              return (
                <div key={project.id} className="glass rounded-3xl overflow-hidden border border-white/10 group">
                  <div className="aspect-video relative overflow-hidden bg-black">
                    {project.niche === Niche.VIDEO ? (
                      <ProjectVideo
                        src={project.image}
                        title={project.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        muted
                        loop
                        hoverPlay
                      />
                    ) : imgs.length > 1 ? (
                      <ImageCarousel
                        images={imgs}
                        alt={project.title}
                        stopPropagation
                        imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    )}
                    <div className="absolute top-4 right-4 flex gap-2 z-20">
                      <button
                        onClick={() => openEditForm(project)}
                        className="p-3 bg-orange-500/90 backdrop-blur-md rounded-full text-black hover:bg-orange-600 transition-colors"
                        aria-label="Edit project"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-3 bg-red-500/80 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-colors"
                        aria-label="Delete project"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4 z-10">
                      <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {project.niche}
                        {imgs.length > 1 ? ` · ${imgs.length}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-orange-500 text-[10px] font-bold uppercase tracking-widest mb-2">{project.category}</p>
                    <h3 className="text-xl font-serif font-bold mb-2">{project.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{project.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

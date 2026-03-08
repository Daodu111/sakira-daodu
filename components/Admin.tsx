import React, { useState, useEffect, useRef } from 'react';
import { Niche } from '../types';
import { Project, fetchProjects as apiFetchProjects, addProject as apiAddProject, deleteProject as apiDeleteProject } from '../lib/projectsApi';
import { useFirestore, uploadImageToStorage } from '../lib/firebaseClient';
import { useTheme } from './ThemeContext';
import AdminLogin from './AdminLogin';
import { ArrowLeft, Plus, Trash2, Save, X, Image as ImageIcon, Film, Upload, LogOut } from 'lucide-react';

const AUTH_KEY = 'admin_token';

interface AdminProps {
  onBack: () => void;
}

const Admin: React.FC<AdminProps> = ({ onBack }) => {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(AUTH_KEY));
  const { theme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: '',
    category: '',
    image: '',
    niche: Niche.DESIGN,
    description: ''
  });

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      if (useFirestore()) {
        const url = await uploadImageToStorage(file);
        setNewProject(prev => ({ ...prev, image: url }));
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewProject(prev => ({ ...prev, image: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Upload failed (check Firebase Storage rules). Use an image URL instead: paste a link from Imgur, Cloudinary, or any image host.');
    } finally {
      setUploading(false);
    }
  };

  const handleLoginSuccess = (authToken: string) => {
    sessionStorage.setItem(AUTH_KEY, authToken);
    setToken(authToken);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setToken(null);
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiAddProject(
        { title: newProject.title!, category: newProject.category!, image: newProject.image!, niche: newProject.niche!, description: newProject.description! },
        token
      );
      await fetchProjects();
      setIsAdding(false);
      setNewProject({
        title: '',
        category: '',
        image: '',
        niche: Niche.DESIGN,
        description: ''
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && err.status === 401) {
        handleLogout();
        return;
      }
      console.error('Error adding project:', err);
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
          <h1 className="text-3xl font-serif font-bold">Project <span className="text-orange-500">Management</span></h1>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-orange-500 text-black px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-orange-600 transition-all"
          >
            <Plus className="w-5 h-5" /> Add New Project
          </button>
        </div>

        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 dark:bg-black/80 backdrop-blur-sm">
            <div className="glass w-full max-w-2xl rounded-3xl p-8 border border-black/10 dark:border-white/10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-serif font-bold">Add New <span className="text-orange-500">Project</span></h2>
                <button onClick={() => setIsAdding(false)} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddProject} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Title</label>
                    <input 
                      required
                      type="text" 
                      value={newProject.title}
                      onChange={e => setNewProject({...newProject, title: e.target.value})}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all"
                      placeholder="Project Title"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Category</label>
                    <input 
                      required
                      type="text" 
                      value={newProject.category}
                      onChange={e => setNewProject({...newProject, category: e.target.value})}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all"
                      placeholder="e.g. Logo Design"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    {newProject.niche === Niche.DESIGN ? 'Design Asset' : 'Video Asset'}
                  </label>
                  {useFirestore() ? (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Paste a URL (Imgur, Cloudinary, etc.) or use Upload. If upload fails, enable Storage rules in Firebase Console.</p>
                  ) : (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">For large images, paste a URL from <a href="https://imgur.com" target="_blank" rel="noreferrer" className="text-orange-500 underline">Imgur.com</a> (free, no account). Upload works for smaller images.</p>
                  )}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input 
                        required
                        type="text" 
                        value={newProject.image}
                        onChange={e => setNewProject({...newProject, image: e.target.value})}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all"
                        placeholder={newProject.niche === Niche.DESIGN ? "Image URL (https://...)" : "Video URL (https://...)"}
                      />
                    </div>
                    <div className="relative">
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept={newProject.niche === Niche.DESIGN ? "image/*" : "video/*"}
                        className="hidden"
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="h-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-6 hover:bg-black/10 dark:hover:bg-white/10 transition-all flex items-center gap-2 text-sm font-bold"
                      >
                        {uploading ? (
                          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Upload
                      </button>
                    </div>
                  </div>
                  {newProject.image && newProject.image.startsWith('data:') && (
                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">File attached successfully</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Niche</label>
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setNewProject({...newProject, niche: Niche.DESIGN})}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${newProject.niche === Niche.DESIGN ? 'bg-orange-500 text-black border-orange-500' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400'}`}
                    >
                      <ImageIcon className="w-4 h-4" /> Graphic Design
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewProject({...newProject, niche: Niche.VIDEO})}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${newProject.niche === Niche.VIDEO ? 'bg-orange-500 text-black border-orange-500' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400'}`}
                    >
                      <Film className="w-4 h-4" /> Video Editing
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Description</label>
                  <textarea 
                    required
                    rows={3}
                    value={newProject.description}
                    onChange={e => setNewProject({...newProject, description: e.target.value})}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all resize-none"
                    placeholder="Brief description of the project..."
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" /> Save Project
                </button>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map(project => (
              <div key={project.id} className="glass rounded-3xl overflow-hidden border border-white/10 group">
                <div className="aspect-video relative overflow-hidden bg-black">
                  {project.niche === Niche.VIDEO ? (
                    <video 
                      src={project.image} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      muted
                      loop
                      onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                    />
                  ) : (
                    <img 
                      src={project.image} 
                      alt={project.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                  <div className="absolute top-4 right-4">
                    <button 
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-3 bg-red-500/80 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {project.niche}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-orange-500 text-[10px] font-bold uppercase tracking-widest mb-2">{project.category}</p>
                  <h3 className="text-xl font-serif font-bold mb-2">{project.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{project.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

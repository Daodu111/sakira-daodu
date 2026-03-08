
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { Niche } from './types';
import { Project } from './lib/projectsApi';
import { TOOL_LOGOS } from './constants';
import CircularSkill from './components/CircularSkill';
import ProjectCard from './components/ProjectCard';
import Admin from './components/Admin';
import ContactFormModal from './components/ContactFormModal';
import ProjectPreviewModal from './components/ProjectPreviewModal';
import { useTheme } from './components/ThemeContext';
import { ArrowRight, Mail, Instagram, Linkedin, Twitter, Play, MousePointer2, ChevronRight, Menu, X, Settings, Sun, Moon } from 'lucide-react';

const Portfolio: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeNiche, setActiveNiche] = useState<Niche>(Niche.DESIGN);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [previewProject, setPreviewProject] = useState<Project | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    fetchProjects();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchProjects = async () => {
    try {
      const { fetchProjects: apiFetch } = await import('./lib/projectsApi');
      const data = await apiFetch();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => p.niche === activeNiche);

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white transition-colors duration-300">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'glass py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="text-2xl font-serif font-bold tracking-tighter cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            SAKIRA<span className="text-orange-500">.</span>D
          </div>
          
          <div className="hidden md:flex items-center gap-12 text-sm font-semibold tracking-widest uppercase">
            <a href="#work" className="hover:text-orange-500 transition-colors">Work</a>
            <a href="#expertise" className="hover:text-orange-500 transition-colors">Expertise</a>
            <a href="#about" className="hover:text-orange-500 transition-colors">About</a>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-orange-500" /> : <Moon className="w-5 h-5 text-orange-500" />}
            </button>
            <button onClick={() => setIsContactOpen(true)} className="bg-orange-500 text-black px-6 py-2 rounded-full hover:bg-orange-600 transition-colors">Let's Talk</button>
          </div>

          <div className="flex items-center gap-4 md:hidden">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-orange-500" /> : <Moon className="w-5 h-5 text-orange-500" />}
            </button>
            <button className="text-black dark:text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 glass flex flex-col items-center justify-center gap-8 text-2xl font-bold uppercase">
          <a href="#work" onClick={() => setIsMenuOpen(false)}>Work</a>
          <a href="#expertise" onClick={() => setIsMenuOpen(false)}>Expertise</a>
          <a href="#about" onClick={() => setIsMenuOpen(false)}>About</a>
          <button onClick={() => { setIsMenuOpen(false); setIsContactOpen(true); }} className="text-orange-500">Contact</button>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video Layer */}
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover opacity-50 scale-105"
            poster="https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1920&q=80"
            onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-abstract-digital-grid-43949-large.mp4" type="video/mp4" />
          </video>
          {/* Enhanced Overlay Gradients for Cinematic Feel */}
          <div className="absolute inset-0 bg-gradient-to-b from-white dark:from-[#050505] via-transparent to-white dark:to-[#050505]"></div>
          <div className="absolute inset-0 bg-white/40 dark:bg-[#050505]/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-[#050505] via-transparent to-white/40 dark:to-[#050505]/40"></div>
        </div>

        {/* Floating Blurs for Extra Depth */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="container mx-auto text-center relative z-10 px-6">
          <h1 className="text-6xl md:text-9xl font-serif font-bold tracking-tighter leading-none mb-8 drop-shadow-2xl">
            CRAFTING <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">DESIGNS</span><br />
            THAT CONNECT
          </h1>
          <p className="max-w-2xl mx-auto text-gray-700 dark:text-gray-200 text-lg md:text-xl leading-relaxed mb-12 drop-shadow-md font-medium">
            Independent Graphic Designer & Video Editor based in the creative nexus. 
            Blending functionality with aesthetics to create human-centered visual stories.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href="#work" className="group flex items-center gap-3 bg-black dark:bg-white text-white dark:text-black px-10 py-5 rounded-full font-bold transition-all hover:bg-orange-500 hover:text-white hover:scale-105 active:scale-95 shadow-xl shadow-black/5 dark:shadow-white/5">
              See My Work <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <div className="flex items-center gap-4 text-sm font-bold text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-1"><ChevronRight className="w-4 h-4 text-orange-500" /> 10+ Years Experience</span>
              <span className="flex items-center gap-1"><ChevronRight className="w-4 h-4 text-orange-500" /> 2400+ Clients</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <div className="w-6 h-10 border-2 border-black dark:border-white rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-black dark:bg-white rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Niche Selector */}
      <section id="work" className="py-24 bg-gray-50 dark:bg-[#080808] relative z-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div>
              <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.3em] mb-4">/ Featured Work</p>
              <h2 className="text-4xl md:text-6xl font-serif font-bold">Showcasing <span className="text-orange-500">Excellence</span></h2>
            </div>
            
            <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-full border border-black/10 dark:border-white/10 self-start backdrop-blur-md">
              <button 
                onClick={() => setActiveNiche(Niche.DESIGN)}
                className={`flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all ${activeNiche === Niche.DESIGN ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
              >
                <MousePointer2 className="w-4 h-4" /> Graphic Design
              </button>
              <button 
                onClick={() => setActiveNiche(Niche.VIDEO)}
                className={`flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all ${activeNiche === Niche.VIDEO ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
              >
                <Play className="w-4 h-4" /> Video Editing
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} onClick={() => setPreviewProject(project)} />
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-gray-500">
                No projects found in this category.
              </div>
            )}
          </div>

          <div className="mt-16 text-center">
            <button className="text-gray-500 dark:text-gray-400 hover:text-orange-500 font-bold flex items-center gap-2 mx-auto transition-colors group">
              View All Projects <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Expertise & Skills */}
      <section id="expertise" className="py-24 border-y border-black/5 dark:border-white/5 relative z-10 bg-white dark:bg-[#050505]">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20">
            <div>
              <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.3em] mb-4">/ Skillset & Passion</p>
              <h2 className="text-4xl md:text-6xl font-serif font-bold mb-8">When Skill and <br /><span className="text-orange-500">Passion</span> Collide</h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-12">
                It's like a design fireworks show—impossible to ignore. I combine decade-long expertise 
                with a relentless drive to innovate across the digital spectrum.
              </p>

              <div className="space-y-6">
                <div className="p-8 glass rounded-2xl border-l-4 border-orange-500 hover:border-l-8 transition-all">
                  <h3 className="font-serif text-2xl mb-4">Key Capabilities</h3>
                  <ul className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Graphic Design</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Photo Editing</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Typography</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Brand Identity</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Visual Storytelling</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Motion Graphics</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="glass p-10 rounded-3xl border border-black/10 dark:border-white/10">
                <h3 className="text-xl font-bold uppercase tracking-widest text-center mb-10">Creative Tools</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                  <CircularSkill label="Ps" percentage={95} color={TOOL_LOGOS.Ps.color} />
                  <CircularSkill label="Ai" percentage={90} color={TOOL_LOGOS.Ai.color} />
                  <CircularSkill label="Ae" percentage={85} color={TOOL_LOGOS.Ae.color} />
                  <CircularSkill label="Pr" percentage={88} color={TOOL_LOGOS.Pr.color} />
                  <CircularSkill label="Figma" percentage={92} color={TOOL_LOGOS.Figma.color} />
                  <CircularSkill label="Id" percentage={80} color={TOOL_LOGOS.Id.color} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50 dark:bg-[#080808] relative z-10">
        <div className="container mx-auto px-6 text-center">
          <p className="font-script text-3xl text-orange-500 mb-6">Voices of Success</p>
          <h2 className="text-4xl md:text-6xl font-serif font-bold mb-16">Stories from Our <span className="text-orange-500">Clients</span></h2>
          
          <div className="max-w-4xl mx-auto glass p-12 rounded-3xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-4 border-gray-50 dark:border-[#080808] overflow-hidden">
              <img src="https://picsum.photos/seed/person1/200/200" alt="Client" />
            </div>
            <p className="text-2xl italic text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
              "Collaborating with Sakira was an inspiring experience. She quickly grasped our vision, 
              asked the right questions and delivered designs that perfectly balanced aesthetics and 
              functionality. Her creative approach and attention to detail make every step of the process smooth and enjoyable."
            </p>
            <div>
              <p className="font-bold text-lg">Rina Kurasawa</p>
              <p className="text-orange-500 text-sm uppercase tracking-widest">CTO at LuminaTech</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Footer */}
      <footer id="contact" className="py-24 relative overflow-hidden bg-white dark:bg-[#050505]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-20">
          <div className="text-[20vw] font-serif font-bold text-black/5 dark:text-white/5 whitespace-nowrap text-center select-none uppercase">SAKIRA DAODU</div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-5xl md:text-7xl font-serif font-bold mb-12 leading-tight">Let's build something<br /><span className="text-orange-500">extraordinary</span> together.</h2>
          <a href="mailto:sakira.design01@gmail.com" className="group inline-flex items-center gap-4 text-2xl md:text-4xl font-bold hover:text-orange-500 transition-all mb-16">
            sakira.design01@gmail.com <ArrowRight className="w-8 h-8 md:w-12 md:h-12 group-hover:translate-x-4 transition-transform" />
          </a>

          <div className="flex flex-col md:flex-row items-center justify-between pt-12 border-t border-black/5 dark:border-white/5">
            <div className="flex items-center gap-8 mb-8 md:mb-0">
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors"><Linkedin className="w-5 h-5" /></a>
              <Link to="/admin" className="text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                <Settings className="w-4 h-4" /> Admin
              </Link>
            </div>
            
            <div className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} SAKIRA DAODU. CREATIVE STUDIO
            </div>
          </div>
        </div>
      </footer>

      <ContactFormModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      <ProjectPreviewModal project={previewProject} onClose={() => setPreviewProject(null)} />
    </div>
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<Portfolio />} />
      <Route path="/admin" element={<Admin onBack={() => navigate('/')} />} />
    </Routes>
  );
};

export default App;

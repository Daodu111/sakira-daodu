
import React from 'react';
import { Project } from '../lib/projectsApi';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  return (
    <div
      className="group relative overflow-hidden rounded-xl glass hover-lift cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    >
      <div className="aspect-square md:aspect-video overflow-hidden bg-black">
        {project.niche === 'VIDEO' ? (
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
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
        <span className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-1">{project.category}</span>
        <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
        <p className="text-gray-200 text-sm line-clamp-2">{project.description}</p>
      </div>
    </div>
  );
};

export default ProjectCard;

import React from 'react';
import { Project } from '../lib/projectsApi';
import { getProjectImages, getPrimaryMedia } from '../lib/projectMedia';
import ImageCarousel from './ImageCarousel';
import ProjectVideo from './ProjectVideo';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const images = getProjectImages(project);
  const isVideo = project.niche === 'VIDEO';
  const hasCarousel = !isVideo && images.length > 1;

  return (
    <div
      className="group relative overflow-hidden rounded-xl glass hover-lift cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    >
      <div className="aspect-square md:aspect-video overflow-hidden bg-black relative">
        {isVideo ? (
          <ProjectVideo
            src={getPrimaryMedia(project)}
            title={project.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            muted
            loop
            hoverPlay
          />
        ) : hasCarousel ? (
          <ImageCarousel
            images={images}
            alt={project.title}
            stopPropagation
            prominent
            imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <img
            src={getPrimaryMedia(project)}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}

        {/* Text/title overlay — below carousel controls (z-30), no pointer capture */}
        <div className="absolute inset-0 z-[5] bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 pointer-events-none">
          <span className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-1">{project.category}</span>
          <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
          <p className="text-gray-200 text-sm line-clamp-2">{project.description}</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;

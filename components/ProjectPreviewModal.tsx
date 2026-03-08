import React from 'react';
import { Project } from '../lib/projectsApi';
import { X } from 'lucide-react';

interface ProjectPreviewModalProps {
  project: Project | null;
  onClose: () => void;
}

const ProjectPreviewModal: React.FC<ProjectPreviewModalProps> = ({ project, onClose }) => {
  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white hover:text-orange-500 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-8 h-8" />
        </button>
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">
          <div className="bg-black flex items-center justify-center overflow-y-auto min-h-[60vh] max-h-[80vh] p-4">
            {project.niche === 'VIDEO' ? (
              <video
                src={project.image}
                controls
                autoPlay
                className="max-w-full max-h-[75vh] w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLVideoElement).style.display = 'none';
                }}
              />
            ) : (
              <img
                src={project.image}
                alt={project.title}
                className="max-w-full max-h-[75vh] w-auto object-contain"
              />
            )}
          </div>
          <div className="p-6">
            <span className="text-orange-500 text-xs font-bold uppercase tracking-widest">{project.category}</span>
            <h2 className="text-2xl font-serif font-bold mt-2">{project.title}</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{project.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPreviewModal;

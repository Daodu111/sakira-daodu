import React, { useState } from 'react';
import {
  getYouTubeId,
  getVimeoId,
  isLikelyImageUrl,
  isLikelyVideoUrl,
} from '../lib/projectMedia';

interface ProjectVideoProps {
  src: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  /** Card hover-to-play behavior */
  hoverPlay?: boolean;
  title?: string;
}

/**
 * Renders project video media: native MP4, YouTube/Vimeo embeds,
 * or falls back to an image when a VIDEO niche was given an image URL.
 */
const ProjectVideo: React.FC<ProjectVideoProps> = ({
  src,
  className = 'w-full h-full object-cover',
  controls = false,
  autoPlay = false,
  muted = true,
  loop = false,
  hoverPlay = false,
  title = 'Video',
}) => {
  const [failed, setFailed] = useState(false);
  const yt = getYouTubeId(src);
  const vimeo = getVimeoId(src);

  if (yt) {
    return (
      <iframe
        title={title}
        src={`https://www.youtube.com/embed/${yt}?rel=0&modestbranding=1${autoPlay ? '&autoplay=1' : ''}`}
        className={className.includes('object-') ? className.replace(/object-\w+/g, '') + ' w-full h-full border-0' : `${className} border-0`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (vimeo) {
    return (
      <iframe
        title={title}
        src={`https://player.vimeo.com/video/${vimeo}${autoPlay ? '?autoplay=1' : ''}`}
        className={className.includes('object-') ? className.replace(/object-\w+/g, '') + ' w-full h-full border-0' : `${className} border-0`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // Seed / misconfigured VIDEO entries that point at still images
  if (failed || (isLikelyImageUrl(src) && !isLikelyVideoUrl(src))) {
    return (
      <img
        src={src}
        alt={title}
        className={className}
      />
    );
  }

  return (
    <video
      src={src}
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
      onMouseEnter={
        hoverPlay
          ? (e) => {
              e.currentTarget.play().catch(() => {});
            }
          : undefined
      }
      onMouseLeave={
        hoverPlay
          ? (e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }
          : undefined
      }
    />
  );
};

export default ProjectVideo;

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  imgClassName?: string;
  showControls?: boolean;
  /** Stop click from bubbling (e.g. card open) when navigating */
  stopPropagation?: boolean;
  /** Larger, always-on controls for portfolio cards */
  prominent?: boolean;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  alt,
  className = '',
  imgClassName = 'w-full h-full object-cover',
  showControls = true,
  stopPropagation = false,
  prominent = false,
}) => {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const imagesKey = images.join('\0');
  const prevKey = useRef(imagesKey);

  useEffect(() => {
    if (prevKey.current !== imagesKey) {
      prevKey.current = imagesKey;
      setIndex(0);
    }
  }, [imagesKey]);

  if (total === 0) return null;

  const go = (next: number, e?: React.MouseEvent) => {
    if (stopPropagation && e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIndex((next + total) % total);
  };

  const btnBase = prominent
    ? 'absolute top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 text-white hover:bg-orange-500 shadow-lg transition-colors z-30'
    : 'absolute top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-30';

  return (
    <div className={`relative w-full h-full ${className}`}>
      <img
        src={images[index]}
        alt={`${alt}${total > 1 ? ` (${index + 1}/${total})` : ''}`}
        className={imgClassName}
        draggable={false}
      />
      {total > 1 && showControls && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => go(index - 1, e)}
            className={`${btnBase} left-2`}
          >
            <ChevronLeft className={prominent ? 'w-6 h-6' : 'w-5 h-5'} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => go(index + 1, e)}
            className={`${btnBase} right-2`}
          >
            <ChevronRight className={prominent ? 'w-6 h-6' : 'w-5 h-5'} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={(e) => {
                  if (stopPropagation) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                  setIndex(i);
                }}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'bg-orange-500 w-4' : 'bg-white/70 hover:bg-white w-2'
                }`}
              />
            ))}
          </div>
          {prominent && (
            <span className="absolute top-3 right-3 z-30 text-[10px] font-bold uppercase tracking-widest bg-black/60 text-white px-2 py-1 rounded-full">
              {index + 1} / {total}
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default ImageCarousel;

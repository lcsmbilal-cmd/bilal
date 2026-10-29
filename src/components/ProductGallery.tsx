import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Play,
  Film,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productTitle: string;
  badge?: string;
  videoUrl?: string;
  productVideoLink?: string;
}

/**
 * Parses video URL to determine if it is YouTube or direct MP4 / video file.
 */
function parseVideoSource(url?: string): {
  isValid: boolean;
  isYouTube: boolean;
  embedUrl?: string;
  directUrl?: string;
} {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { isValid: false, isYouTube: false };
  }
  const clean = url.trim();

  // YouTube Link Detection (standard, short, embed, shorts)
  const ytMatch = clean.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return {
      isValid: true,
      isYouTube: true,
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&playsinline=1&rel=0`
    };
  }

  if (clean.includes('youtube.com/embed/')) {
    const hasParams = clean.includes('?');
    return {
      isValid: true,
      isYouTube: true,
      embedUrl: hasParams ? `${clean}&autoplay=1&mute=1&playsinline=1` : `${clean}?autoplay=1&mute=1&playsinline=1`
    };
  }

  // Direct MP4 or video files
  return {
    isValid: true,
    isYouTube: false,
    directUrl: clean
  };
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  productTitle,
  badge,
  videoUrl,
  productVideoLink
}) => {
  const safeImages = images && images.length > 0 ? images : [
    'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=1000&q=85'
  ];

  const effectiveVideo = productVideoLink || videoUrl;
  const videoInfo = parseVideoSource(effectiveVideo);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  // Reset video mode when product changes
  useEffect(() => {
    setIsVideoActive(false);
    setActiveIndex(0);
  }, [productTitle, effectiveVideo]);

  // Touch swipe handling for images
  const touchStartX = useRef<number | null>(null);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isVideoActive) {
      setIsVideoActive(false);
      setActiveIndex(safeImages.length - 1);
      return;
    }
    setActiveIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isVideoActive) {
      setIsVideoActive(false);
      setActiveIndex(0);
      return;
    }
    setActiveIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isVideoActive) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isVideoActive || touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isVideoActive) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Main Display Container (Aspect Square) */}
      <div
        className={`relative w-full aspect-square rounded-3xl overflow-hidden border border-neutral-200/80 shadow-sm select-none group bg-black`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => !isVideoActive && setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Dynamic Display: Video Player vs Photo Zoom */}
        {isVideoActive && videoInfo.isValid ? (
          <div className="w-full h-full relative bg-black flex items-center justify-center">
            {videoInfo.isYouTube && videoInfo.embedUrl ? (
              <iframe
                src={videoInfo.embedUrl}
                title={`${productTitle} Video Player`}
                className="w-full h-full border-0 absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video
                key={videoInfo.directUrl}
                controls
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain bg-black"
              >
                <source src={videoInfo.directUrl} type="video/mp4" />
                <source src={videoInfo.directUrl} type="video/webm" />
                Your browser does not support HTML5 video playback.
              </video>
            )}

            {/* Back to Images button */}
            <button
              type="button"
              onClick={() => setIsVideoActive(false)}
              className="absolute top-4 left-4 z-20 bg-black/80 hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20 transition cursor-pointer backdrop-blur-xs"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Back to Photos</span>
            </button>
          </div>
        ) : (
          /* Active Main Photo */
          <>
            <img
              src={safeImages[activeIndex]}
              alt={`${productTitle} - Photo ${activeIndex + 1}`}
              loading="lazy"
              className={`w-full h-full object-cover transition-transform duration-200 ease-out cursor-crosshair ${
                isZoomed ? 'scale-150' : 'scale-100'
              }`}
              style={
                isZoomed
                  ? {
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    }
                  : undefined
              }
            />

            {/* Promo / Bestseller Badge */}
            {badge && (
              <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <span className="bg-[#171717]/90 backdrop-blur-xs text-[#F5B800] text-xs font-extrabold px-3 py-1.5 rounded-full shadow-md border border-[#F5B800]/30 tracking-wide">
                  {badge}
                </span>
              </div>
            )}

            {/* Quick Watch Video Button Overlay (when video is available) */}
            {videoInfo.isValid && (
              <button
                type="button"
                onClick={() => setIsVideoActive(true)}
                className="absolute top-4 right-14 z-10 bg-black/80 hover:bg-[#F5B800] text-white hover:text-black text-xs font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md border border-white/20 transition cursor-pointer backdrop-blur-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Watch Video</span>
              </button>
            )}

            {/* Fullscreen Zoom trigger */}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label="View fullscreen image"
              className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/90 hover:bg-white text-neutral-800 rounded-xl shadow-md flex items-center justify-center transition hover:scale-105 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Navigation Arrows for Photos */}
            {safeImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-800 shadow-md flex items-center justify-center transition md:opacity-0 md:group-hover:opacity-100 hover:scale-110 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-800 shadow-md flex items-center justify-center transition md:opacity-0 md:group-hover:opacity-100 hover:scale-110 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Image counter indicator */}
            <div className="absolute bottom-3 right-3 z-10 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full pointer-events-none">
              {activeIndex + 1} / {safeImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails Row: Images + Optional Video Thumbnail */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
        {/* Photo Thumbnails */}
        {safeImages.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setIsVideoActive(false);
              setActiveIndex(idx);
            }}
            aria-label={`Photo ${idx + 1}`}
            className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
              !isVideoActive && activeIndex === idx
                ? 'border-[#F5B800] ring-2 ring-[#F5B800]/30 scale-102 shadow-sm'
                : 'border-neutral-200 hover:border-neutral-400 opacity-80 hover:opacity-100'
            }`}
          >
            <img
              src={img}
              alt={`Thumbnail ${idx + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}

        {/* Video Thumbnail Button (if product video link is present) */}
        {videoInfo.isValid && (
          <button
            type="button"
            onClick={() => setIsVideoActive(true)}
            aria-label="Play product video"
            className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition cursor-pointer flex flex-col items-center justify-center bg-neutral-900 group ${
              isVideoActive
                ? 'border-[#F5B800] ring-2 ring-[#F5B800]/40 scale-102 shadow-md'
                : 'border-neutral-300 hover:border-neutral-500 opacity-90 hover:opacity-100'
            }`}
          >
            {safeImages[0] ? (
              <img
                src={safeImages[0]}
                alt="Video thumbnail preview"
                className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-neutral-800" />
            )}

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F5B800] text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-white mt-1 uppercase tracking-wider drop-shadow-sm">
                Video
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Lightbox Fullscreen Modal for Photos */}
      {lightboxOpen && !isVideoActive && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-800 z-50 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          {safeImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-3 rounded-full bg-neutral-800/80 hover:bg-neutral-800 transition z-50 cursor-pointer"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-3 rounded-full bg-neutral-800/80 hover:bg-neutral-800 transition z-50 cursor-pointer"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[85vh] flex items-center justify-center select-none">
            <img
              src={safeImages[activeIndex]}
              alt={`${productTitle} - Large`}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium">
            {activeIndex + 1} of {safeImages.length}
          </div>
        </div>
      )}
    </div>
  );
};

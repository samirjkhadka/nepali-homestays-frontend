import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react';

export interface PhotoGalleryProps {
  /** Array of image URLs (can be relative; use resolveUrl to get full URL) */
  images: string[];
  title: string;
  /** Optional: resolve relative URLs to full (e.g. prepend API base) */
  resolveUrl?: (url: string) => string;
}

export function PhotoGallery({ images, title, resolveUrl = (u) => u }: PhotoGalleryProps) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const urls = images.map((u) => resolveUrl(u));
  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % urls.length);
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);

  if (urls.length === 0) {
    return (
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[500px] rounded-2xl overflow-hidden bg-muted">
        <div className="col-span-2 row-span-2 flex items-center justify-center text-muted-foreground">
          No photos
        </div>
      </div>
    );
  }

  const onlyOne = urls.length === 1;

  return (
    <>
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[500px] rounded-2xl overflow-hidden relative">
        {/* Main Image */}
        <motion.div
          whileHover={{ opacity: 0.9 }}
          onClick={() => {
            setCurrentIndex(0);
            setShowLightbox(true);
          }}
          className={onlyOne ? 'col-span-4 row-span-2 relative cursor-pointer' : 'col-span-2 row-span-2 relative cursor-pointer'}
        >
          <img
            src={urls[0]}
            alt={`${title} - Main`}
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Secondary Images */}
        {urls.slice(1, 5).map((src, index) => (
          <motion.div
            key={index}
            whileHover={{ opacity: 0.9 }}
            onClick={() => {
              setCurrentIndex(index + 1);
              setShowLightbox(true);
            }}
            className="relative cursor-pointer"
          >
            <img
              src={src}
              alt={`${title} - ${index + 2}`}
              className="w-full h-full object-cover"
            />
            {index === 3 && urls.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  +{urls.length - 5} more
                </span>
              </div>
            )}
          </motion.div>
        ))}

        {/* Show All Button */}
        <button
          type="button"
          onClick={() => setShowLightbox(true)}
          className="absolute bottom-4 right-4 px-4 py-2 bg-card rounded-lg shadow-lg flex items-center gap-2 font-medium hover:bg-muted transition-colors text-foreground"
        >
          <Grid3X3 className="w-4 h-4" />
          Show all photos
        </button>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          >
            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-50"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="absolute top-4 left-4 text-white font-medium">
              {currentIndex + 1} / {urls.length}
            </div>

            <button
              type="button"
              onClick={prevImage}
              className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            <button
              type="button"
              onClick={nextImage}
              className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>

            <motion.img
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={urls[currentIndex]}
              alt={`${title} - ${currentIndex + 1}`}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] pb-2">
              {urls.map((src, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? 'border-white scale-110'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={src}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

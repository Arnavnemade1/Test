import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { addImage, deleteImage, getAllImages, type StoredImage } from '../lib/imageStore';

interface GalleryImage extends StoredImage {
  url: string;
}

interface GalleryProps {
  onLock: () => void;
}

export function Gallery({ onLock }: GalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const stored = await getAllImages();
    setImages(stored.map((img) => ({ ...img, url: URL.createObjectURL(img.blob) })));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
      for (const file of valid) {
        await addImage(file);
      }
      await refresh();
    },
    [refresh],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteImage(id);
      setLightbox((current) => (current?.id === id ? null : current));
      await refresh();
    },
    [refresh],
  );

  return (
    <div className="gallery-screen">
      <div className="gallery-backdrop" />

      <header className="gallery-header">
        <motion.h1
          className="gallery-title"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          VaultLens
        </motion.h1>
        <motion.button
          className="lock-button"
          onClick={onLock}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Lock Vault
        </motion.button>
      </header>

      <motion.div
        className={`dropzone ${dragActive ? 'dropzone-active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="dropzone-glow" />
        <p className="dropzone-text">Drop images here, or click to upload</p>
      </motion.div>

      <div className="gallery-grid">
        {loading ? (
          <p className="gallery-empty">Loading vault…</p>
        ) : images.length === 0 ? (
          <p className="gallery-empty">No images yet. Add your first one above.</p>
        ) : (
          <AnimatePresence>
            {images.map((img, i) => (
              <motion.div
                key={img.id}
                className="gallery-item"
                layout
                initial={{ opacity: 0, y: 24, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => setLightbox(img)}
              >
                <img src={img.url} alt={img.name} loading="lazy" />
                <div className="gallery-item-overlay">
                  <span className="gallery-item-name">{img.name}</span>
                  <button
                    className="gallery-item-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(img.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <motion.img
              src={lightbox.url}
              alt={lightbox.name}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

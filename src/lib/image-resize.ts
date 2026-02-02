/**
 * Resize image to stay under maxSizeBytes (e.g. 700KB for backend limit).
 * Uses canvas to draw, compress with JPEG quality, and optionally scale down.
 */
const DEFAULT_MAX_BYTES = 700 * 1024;
const MAX_DIMENSION = 1920;
const INITIAL_QUALITY = 0.85;

export async function resizeImageFile(
  file: File,
  maxSizeBytes: number = DEFAULT_MAX_BYTES
): Promise<File> {
  if (file.size <= maxSizeBytes && (file.type === 'image/jpeg' || file.type === 'image/png')) {
    return file;
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      let quality = INITIAL_QUALITY;
      const tryBlob = (): void => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            if (blob.size <= maxSizeBytes || quality <= 0.2) {
              const resized = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() });
              resolve(resized);
              return;
            }
            quality -= 0.15;
            tryBlob();
          },
          'image/jpeg',
          quality
        );
      };
      tryBlob();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export async function resizeImageFiles(files: File[], maxSizeBytes: number = DEFAULT_MAX_BYTES): Promise<File[]> {
  return Promise.all(files.map((f) => resizeImageFile(f, maxSizeBytes)));
}

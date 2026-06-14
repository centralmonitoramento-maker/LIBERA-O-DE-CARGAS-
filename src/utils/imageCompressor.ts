/**
 * Helper utility to compress base64 images using HTML Canvas.
 * This keeps the Firestore document sizes well below the 1MB limit.
 */
export const compressImage = (
  base64Str: string,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.5
): Promise<string> => {
  return new Promise((resolve) => {
    // If it's not a standard data URL, resolve immediately
    if (!base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate dimensions maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0, width, height);
        // Export as compressed JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

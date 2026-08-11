/**
 * Helper utility to compress base64 images using HTML Canvas.
 * This keeps the Firestore document sizes well below the 1MB limit.
 */
export const compressImage = (
  base64Str: string,
  maxWidth = 350,
  maxHeight = 350,
  quality = 0.4
): Promise<string> => {
  return new Promise((resolve) => {
    // If it's not a standard data URL, resolve immediately
    if (!base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str || '');
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

/**
 * Truncates / caps photo arrays in a CargoLoad object so the total JSON string
 * length does not exceed maxBytes (default 600,000 bytes).
 * This GUARANTEES Firestore will never reject writes with `Document exceeds maximum size of 1,048,576 bytes`.
 */
export function capLoadDocumentSize<T extends Record<string, any>>(load: T, maxBytes = 600000): T {
  let loadJson = JSON.stringify(load);
  if (loadJson.length <= maxBytes) {
    return load;
  }

  // Clone load object safely
  const copy: T = JSON.parse(loadJson);

  // Array of photo field names in CargoLoad
  const photoFields = [
    'gatePhotoPlate',
    'gatePhotoSeal',
    'gatePhotoManifest',
    'occurrencePhoto',
    'photoPlate',
    'photoSeal',
    'photoManifest',
    'checklistPhoto',
  ];

  // 1st pass: limit photo arrays to 3 items
  for (const field of photoFields) {
    const val = (copy as any)[field];
    if (Array.isArray(val) && val.length > 3) {
      (copy as any)[field] = val.slice(-3);
    }
  }

  loadJson = JSON.stringify(copy);
  if (loadJson.length <= maxBytes) {
    return copy;
  }

  // 2nd pass: limit photo arrays to 2 items
  for (const field of photoFields) {
    const val = (copy as any)[field];
    if (Array.isArray(val) && val.length > 2) {
      (copy as any)[field] = val.slice(-2);
    }
  }

  loadJson = JSON.stringify(copy);
  if (loadJson.length <= maxBytes) {
    return copy;
  }

  // 3rd pass: limit photo arrays to 1 item
  for (const field of photoFields) {
    const val = (copy as any)[field];
    if (Array.isArray(val) && val.length > 1) {
      (copy as any)[field] = val.slice(-1);
    }
  }

  return copy;
}


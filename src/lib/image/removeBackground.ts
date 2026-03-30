/**
 * Simple background removal for signature images
 * Works best with signatures on white/light backgrounds
 */

interface RemoveBackgroundOptions {
  tolerance?: number; // 0-255, how different a pixel can be from background
  edgeSoftness?: number; // 0-1, smooth edges
}

/**
 * Detects the background color by sampling corners of the image
 * Returns null if background is already transparent
 */
function detectBackgroundColor(
  imageData: ImageData
): { r: number; g: number; b: number; isAlreadyTransparent: boolean } {
  const { data, width, height } = imageData;
  const samples: { r: number; g: number; b: number; a: number }[] = [];

  // Sample corners (5x5 pixels from each corner)
  const sampleSize = 5;
  const corners = [
    { x: 0, y: 0 }, // top-left
    { x: width - sampleSize, y: 0 }, // top-right
    { x: 0, y: height - sampleSize }, // bottom-left
    { x: width - sampleSize, y: height - sampleSize }, // bottom-right
  ];

  for (const corner of corners) {
    for (let dy = 0; dy < sampleSize; dy++) {
      for (let dx = 0; dx < sampleSize; dx++) {
        const x = corner.x + dx;
        const y = corner.y + dy;
        const i = (y * width + x) * 4;
        samples.push({
          r: data[i],
          g: data[i + 1],
          b: data[i + 2],
          a: data[i + 3],
        });
      }
    }
  }

  // Check if corners are already transparent (alpha < 128)
  const avgAlpha = samples.reduce((acc, s) => acc + s.a, 0) / samples.length;
  if (avgAlpha < 128) {
    // Background is already transparent, no need to process
    return { r: 0, g: 0, b: 0, isAlreadyTransparent: true };
  }

  // Average the samples (only considering RGB)
  const avg = samples.reduce(
    (acc, s) => ({ r: acc.r + s.r, g: acc.g + s.g, b: acc.b + s.b }),
    { r: 0, g: 0, b: 0 }
  );
  return {
    r: Math.round(avg.r / samples.length),
    g: Math.round(avg.g / samples.length),
    b: Math.round(avg.b / samples.length),
    isAlreadyTransparent: false,
  };
}

/**
 * Calculates color distance between two colors
 */
function colorDistance(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number }
): number {
  // Using weighted Euclidean distance (human eye is more sensitive to green)
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114);
}

/**
 * Removes background from an image, making it transparent
 * @param imageDataUrl - Base64 data URL of the image
 * @param options - Configuration options
 * @returns Base64 data URL of the image with transparent background
 */
export async function removeBackground(
  imageDataUrl: string,
  options: RemoveBackgroundOptions = {}
): Promise<string> {
  const { tolerance = 50, edgeSoftness = 0.3 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;

      // Detect background color
      const bgColor = detectBackgroundColor(imageData);

      // If background is already transparent, return original image
      if (bgColor.isAlreadyTransparent) {
        resolve(imageDataUrl);
        return;
      }

      // Process each pixel
      for (let i = 0; i < data.length; i += 4) {
        const pixelColor = {
          r: data[i],
          g: data[i + 1],
          b: data[i + 2],
        };

        const distance = colorDistance(pixelColor, bgColor);

        if (distance < tolerance) {
          // Pixel is similar to background - make transparent
          // Apply soft edge based on how close to tolerance
          const alpha = edgeSoftness > 0
            ? Math.min(255, Math.max(0, (distance / tolerance) * 255 * (1 / edgeSoftness)))
            : 0;
          data[i + 3] = Math.round(alpha);
        }
        // Pixels not similar to background keep their original alpha
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}

/**
 * Auto-crops an image to its content bounds (removes transparent padding)
 * Useful for signatures where the canvas is larger than the actual signature
 */
export async function autoCropToContent(
  imageDataUrl: string,
  padding = 10
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imageData;

      // Find bounding box of non-transparent pixels
      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const alpha = data[i + 3];
          if (alpha > 10) { // Pixel is not fully transparent
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      // If no content found, return original
      if (minX >= maxX || minY >= maxY) {
        resolve(imageDataUrl);
        return;
      }

      // Add padding
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(width - 1, maxX + padding);
      maxY = Math.min(height - 1, maxY + padding);

      // Create cropped canvas
      const cropWidth = maxX - minX + 1;
      const cropHeight = maxY - minY + 1;

      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropWidth;
      croppedCanvas.height = cropHeight;
      const croppedCtx = croppedCanvas.getContext('2d');
      if (!croppedCtx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      croppedCtx.drawImage(
        canvas,
        minX, minY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );

      resolve(croppedCanvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}

/**
 * Converts white/light backgrounds to transparent (simpler, faster)
 * Good for signatures drawn on white paper
 */
export async function removeWhiteBackground(
  imageDataUrl: string,
  threshold = 240
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // If pixel is close to white
        if (r > threshold && g > threshold && b > threshold) {
          // Calculate how white it is (0-255)
          const whiteness = Math.min(r, g, b);
          // Make whiter pixels more transparent
          const alpha = Math.max(0, 255 - ((whiteness - threshold) / (255 - threshold)) * 255);
          data[i + 3] = Math.round(alpha);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}

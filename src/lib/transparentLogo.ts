/**
 * Processes an image URL or base64 and strips any solid dark/black background,
 * returning a clean, transparent PNG data URL with antialiased edges.
 */
export async function makeTransparentLogo(imageUrl: string): Promise<string> {
  if (!imageUrl) return '';

  return new Promise((resolve) => {
    const img = new Image();
    if (!imageUrl.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(imageUrl);

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Sample background from the 4 corners and borders
        const samplePoints = [
          0, // top-left
          (canvas.width - 1) * 4, // top-right
          ((canvas.height - 1) * canvas.width) * 4, // bottom-left
          ((canvas.height - 1) * canvas.width + (canvas.width - 1)) * 4, // bottom-right
          Math.floor(canvas.width / 2) * 4, // top-middle
          ((canvas.height - 1) * canvas.width + Math.floor(canvas.width / 2)) * 4 // bottom-middle
        ];

        let bgR = 0, bgG = 0, bgB = 0;
        for (const idx of samplePoints) {
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
        }
        bgR /= samplePoints.length;
        bgG /= samplePoints.length;
        bgB /= samplePoints.length;

        const bgLuma = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;

        // If background is dark (average luma < 60)
        if (bgLuma < 60) {
          const blackCutoff = 45;
          const featherEnd = 95;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a === 0) continue;

            const luma = 0.299 * r + 0.587 * g + 0.114 * b;

            // Distance to sampled background color
            const colorDist = Math.sqrt(
              Math.pow(r - bgR, 2) + 
              Math.pow(g - bgG, 2) + 
              Math.pow(b - bgB, 2)
            );

            if (luma <= blackCutoff || colorDist < 35) {
              data[i + 3] = 0; // 100% transparent
            } else if (luma < featherEnd) {
              const factor = (luma - blackCutoff) / (featherEnd - blackCutoff);
              data[i + 3] = Math.round(a * Math.pow(Math.max(0, Math.min(1, factor)), 1.3));
            }
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(imageUrl);
        }
      } catch (err) {
        console.warn('[makeTransparentLogo] Canvas extraction error:', err);
        resolve(imageUrl);
      }
    };

    img.onerror = () => {
      resolve(imageUrl);
    };

    img.src = imageUrl;
  });
}


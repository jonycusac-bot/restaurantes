export function imageDimensions(width: number, height: number, edge = 1600) {
  const ratio = Math.min(1, edge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

export async function prepareDishImage(file: File, maxBytes = 2 * 1024 * 1024) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 20 * 1024 * 1024)
    throw new Error("Elige una imagen JPG, PNG o WebP de hasta 20 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Este navegador no permite preparar la imagen.");
    const limit = Math.min(750 * 1024, maxBytes);
    let prepared: Blob | null = null;
    for (const scale of [1, 0.8, 0.64, 0.5, 0.4, 0.3, 0.2]) {
      const dimensions = imageDimensions(bitmap.width, bitmap.height, Math.max(320, Math.round(1600 * scale)));
      canvas.width = dimensions.width; canvas.height = dimensions.height;
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const type of ["image/webp", "image/jpeg"] as const) {
        if (type === "image/jpeg") {
          context.save();
          context.globalCompositeOperation = "destination-over";
          context.fillStyle = "#fff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.restore();
        }
        for (const quality of [0.85, 0.7, 0.55, 0.4]) {
          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));
          if (blob && ["image/webp", "image/jpeg", "image/png"].includes(blob.type) && blob.size > 0 && blob.size <= limit) {
            prepared = blob; break;
          }
          // Unsupported encoders may silently return PNG; changing quality
          // cannot make that PNG smaller. Try JPEG or smaller dimensions.
          if (!blob || blob.type !== type) break;
        }
        if (prepared) break;
      }
      if (prepared) break;
    }
    if (!prepared) throw new Error("No se pudo reducir esta imagen al tamaño permitido. Prueba con otra foto.");
    const blob = prepared;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("No se pudo leer la imagen.")); reader.readAsDataURL(blob);
    });
    const extension = { "image/webp": ".webp", "image/jpeg": ".jpg", "image/png": ".png" }[blob.type] ?? ".jpg";
    return { dataUrl, bytes: blob.size, name: file.name.replace(/\.[^.]+$/, "") + extension };
  } finally { bitmap.close(); }
}

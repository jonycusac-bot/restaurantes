export function imageDimensions(width: number, height: number, edge = 1600) {
  const ratio = Math.min(1, edge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

export async function prepareDishImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 20 * 1024 * 1024)
    throw new Error("Elige una imagen JPG, PNG o WebP de hasta 20 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const dimensions = imageDimensions(bitmap.width, bitmap.height);
    canvas.width = dimensions.width; canvas.height = dimensions.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Este navegador no permite preparar la imagen.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let blob: Blob | null = null;
    for (const quality of [0.85, 0.7, 0.55, 0.4]) {
      blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", quality));
      if (blob && blob.size <= 750 * 1024) break;
    }
    if (!blob || blob.size > 2 * 1024 * 1024) throw new Error("No se pudo reducir esta imagen a 2 MB. Prueba con otra foto.");
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("No se pudo leer la imagen.")); reader.readAsDataURL(blob!);
    });
    return { dataUrl, bytes: blob.size, name: file.name.replace(/\.[^.]+$/, "") + (blob.type === "image/webp" ? ".webp" : ".png") };
  } finally { bitmap.close(); }
}

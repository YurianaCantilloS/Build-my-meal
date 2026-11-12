export async function readImageFile(file) {
  if (!file) return null;
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("Selecciona una imagen PNG, JPG o WebP.");
  if (file.size > 12 * 1024 * 1024)
    throw new Error("La imagen no debe superar 12 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 720 / Math.max(image.width, image.height)),
      canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL("image/webp", 0.84);
    if (data.length > 650000)
      throw new Error(
        "Esta foto sigue siendo muy pesada. Prueba una imagen más simple o de menor tamaño.",
      );
    return data;
  } finally {
    URL.revokeObjectURL(url);
  }
}

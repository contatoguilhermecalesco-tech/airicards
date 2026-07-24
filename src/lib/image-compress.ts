// Redimensiona e comprime imagens para uso como avatar (data URL leve).
// Aceita File → retorna JPEG base64 (max ~48KB, 256x256).

export async function compressAvatarFile(
  file: File,
  size = 256,
  quality = 0.82,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Apenas imagens são aceitas.");
  }
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  // crop central quadrado
  const min = Math.min(img.width, img.height);
  const sx = (img.width - min) / 2;
  const sy = (img.height - min) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);

  let out = canvas.toDataURL("image/jpeg", quality);
  // se ainda grande, reduz progressivamente
  let q = quality;
  while (out.length > 70_000 && q > 0.4) {
    q -= 0.1;
    out = canvas.toDataURL("image/jpeg", q);
  }
  return out;
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("Falha ao ler imagem."));
    img.src = src;
  });
}

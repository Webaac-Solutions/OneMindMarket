const MAX_SIDE = 1600;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const toJpeg = async (file) => {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.8),
  );
  return blob;
};

export const prepareImage = async (file) => {
  if (!ALLOWED.includes(file.type)) {
    throw new Error(`${file.name}: only JPG, PNG, WEBP or GIF images are allowed`);
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error(`${file.name}: image is over 25MB`);
  }
  if (file.type === "image/gif") return file;
  let blob = null;
  try {
    blob = await toJpeg(file);
  } catch (err) {
    blob = null;
  }
  if (!blob || blob.size >= file.size) {
    if (file.size > MAX_OUTPUT_BYTES) {
      throw new Error(`${file.name}: image is too large, please pick a smaller one`);
    }
    return file;
  }
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
};

export const prepareImages = async (files, onError) => {
  const ready = [];
  for (const file of files) {
    try {
      ready.push(await prepareImage(file));
    } catch (err) {
      onError(err.message);
    }
  }
  return ready;
};

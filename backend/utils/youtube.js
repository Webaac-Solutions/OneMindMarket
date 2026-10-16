function extractYoutubeId(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

module.exports = { extractYoutubeId };

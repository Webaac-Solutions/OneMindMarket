export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000/api";

export const SERVER_URL = BASE_URL.replace("/api", "");
export const UPLOADS_URL = `${SERVER_URL}/uploads`;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://onemindmarket.in";

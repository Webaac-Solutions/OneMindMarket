/** @type {import('next').NextConfig} */
const apiUrl = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000/api",
    );
  } catch {
    return null;
  }
})();

const nextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000,
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "onemindmarket.in" },
      { protocol: "https", hostname: "img.youtube.com" },
      ...(apiUrl
        ? [
            {
              protocol: apiUrl.protocol.replace(":", ""),
              hostname: apiUrl.hostname,
              ...(apiUrl.port ? { port: apiUrl.port } : {}),
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

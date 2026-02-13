/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/redirect",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; frame-ancestors 'self';",
          },
        ],
      },
      {
        // Apple Universal Links — AASA doit être servi en JSON, sans redirect.
        source: "/.well-known/apple-app-site-association",
        headers: [
          {
            key: "Content-Type",
            value: "application/json",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

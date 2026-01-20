import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NO_HTTPS: process.env.NO_HTTPS,
  },
  serverExternalPackages: ["pg", "drizzle-orm", "sharp"],
  experimental: {
    taint: false,
    authInterrupts: false,
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        "localhost:3001",
        "10.138.73.233:3000",
        "10.138.73.233:3001",
        "72.62.190.235:3000",
        "72.62.190.235:3010",
        "nabd-ai.vercel.app",
        "nabdai.sliplane.app",
        "nabd.sliplane.app",
      ],
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "files.edgestore.dev",
      },
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
    ],
  },
};

export default withNextIntl(nextConfig);

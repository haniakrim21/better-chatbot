import type { NextConfig } from "next";

// Force restart - 404 fix

import createNextIntlPlugin from "next-intl/plugin";

const BUILD_OUTPUT = process.env.NEXT_STANDALONE_OUTPUT
  ? "standalone"
  : undefined;

export default () => {
  const nextConfig: NextConfig = {
    output: BUILD_OUTPUT,
    cleanDistDir: true,
    devIndicators: {
      position: "bottom-right",
    },
    env: {
      NO_HTTPS: process.env.NO_HTTPS,
    },
    serverExternalPackages: ["pg", "sharp"],
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
          "10.138.73.233:3002",
          "10.138.73.233:3003",
          "192.168.8.190:3000",
          "192.168.8.190:3001",
        ],
        bodySizeLimit: "10mb",
      },
    },
  };
  const withNextIntl = createNextIntlPlugin();
  return withNextIntl(nextConfig);
};

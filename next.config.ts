import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow loading the dev server from phones/tunnels (Next 16 blocks
  // cross-origin dev assets by default, which breaks hydration off-device).
  allowedDevOrigins: [
    "192.168.1.190",
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.ngrok.io",
    "*.ngrok-free.dev",
  ],
};

export default nextConfig;

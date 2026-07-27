import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to this project so a stray lockfile elsewhere
    // in the user's home directory doesn't get misdetected as the root.
    root: path.join(__dirname),
  },
};

export default nextConfig;

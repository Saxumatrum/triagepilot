import type { NextConfig } from "next";
import path from "node:path";
import { BASE_PATH } from "./src/lib/basePath";

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  turbopack: {
    // Pin the workspace root to this project so a stray lockfile elsewhere
    // in the user's home directory doesn't get misdetected as the root.
    root: path.join(__dirname),
  },
};

export default nextConfig;

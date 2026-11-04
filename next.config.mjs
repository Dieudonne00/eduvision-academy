import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  images: {
    // Course thumbnails uploaded to Supabase Storage
    remotePatterns: [
      { protocol: "https", hostname: "axslztfouboyqpwckfrr.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  serverExternalPackages: ["gltf-transform"], // Keep specialized Node.js libs out of bundle
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.meshy.ai",
      },
    ],
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fixes npm packages that depend on `fs` module
      config.resolve.fallback.fs = false;
    }

    config.module.rules.push({
      test: /\.node$/,
      use: "node-loader",
    });

    return config;
  },
};

export default nextConfig;

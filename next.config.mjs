/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: false,
  images: { unoptimized: true },
  webpack: (config) => {
    // On Windows, drive-letter casing (E:\ vs e:\) causes webpack to load the
    // same module twice under different IDs, breaking React's context during
    // prerendering ("Cannot read properties of null (reading 'useContext')").
    // Normalize every resolved path to lowercase drive letter.
    config.resolve.plugins = [
      ...(config.resolve.plugins || []),
      {
        apply(resolver) {
          resolver.hooks.result.tap("NormalizeDriveCase", (request) => {
            if (request && typeof request.path === "string") {
              request.path = request.path.replace(
                /^([A-Z]):\\/,
                (_, drive) => drive.toLowerCase() + ":\\",
              );
            }
            return request;
          });
        },
      },
    ];
    return config;
  },
};

export default nextConfig;

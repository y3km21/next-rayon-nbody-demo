/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputStandalone: true,
  },

  async headers() {
    return customHeaders;
  },

  webpack: (config, options) => {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },
};

let customHeaders = [
  {
    source: "/",
    headers: [
      // https://web.dev/coop-coep/
      // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },

      { key: "Access-Control-Allow-Origin", value: "*" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    ],
  },

  {
    source: "/:slug*/:slug([^/]+\\.js|[^/]+\\.html)",
    headers: [
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },

      { key: "Access-Control-Allow-Origin", value: "*" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    ],
  },
];

module.exports = nextConfig;

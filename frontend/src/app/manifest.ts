import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Verifyfund",
    short_name: "Verifyfund",
    description: "On-Chain Crowdfunding platform",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#06B6D4",
    icons: [
      { src: "/verifyfund-32.png", sizes: "32x32", type: "image/png", purpose: "any" },
      { src: "/verifyfund-48.png", sizes: "48x48", type: "image/png", purpose: "any" },
      { src: "/verifyfund-64.png", sizes: "64x64", type: "image/png", purpose: "any" },
      { src: "/verifyfund-128.png", sizes: "128x128", type: "image/png", purpose: "any" },
      { src: "/verifyfund-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/verifyfund-256.png", sizes: "256x256", type: "image/png", purpose: "any" },
      { src: "/verifyfund-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}


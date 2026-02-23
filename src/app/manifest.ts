import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Bolt",
        short_name: "Bolt",
        description: "Bolt headless CMS",
        start_url: "/",
        display: "standalone",
        background_color: "#fafafa",
        theme_color: "#FF9800",
        orientation: "portrait-primary",
        icons: [
            {
                src: "/icon.svg",
                sizes: "32x32",
                type: "image/svg+xml",
                purpose: "any",
            },
            {
                src: "/icon.svg",
                sizes: "192x192",
                type: "image/svg+xml",
                purpose: "any",
            },
            {
                src: "/icon.svg",
                sizes: "512x512",
                type: "image/svg+xml",
                purpose: "any",
            },
        ],
    };
}

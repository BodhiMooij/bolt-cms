import type { Metadata, Viewport } from "next";
import { Onest, Geist_Mono } from "next/font/google";
import { RegisterSw } from "@/components/register-sw";
import "./globals.css";

const onest = Onest({
    variable: "--font-onest",
    subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const viewport: Viewport = {
    themeColor: "#FF9800",
    width: "device-width",
    initialScale: 1,
};

export const metadata: Metadata = {
    title: {
        default: "Blade",
        template: "%s | Blade",
    },
    description: "Blade by Revicx studio",
    icons: {
        icon: "/icon.svg",
        apple: "/icon.svg",
    },
    appleWebApp: {
        capable: true,
        title: "Blade",
        statusBarStyle: "default",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${onest.variable} ${geistMono.variable}`}>
            <body className={`${onest.className} antialiased`}>
                <RegisterSw />
                {children}
            </body>
        </html>
    );
}

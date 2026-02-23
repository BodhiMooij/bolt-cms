"use client";

import { useEffect } from "react";

export function RegisterSw() {
    useEffect(() => {
        if (
            typeof window !== "undefined" &&
            "serviceWorker" in navigator &&
            process.env.NODE_ENV === "production"
        ) {
            navigator.serviceWorker
                .register("/sw.js")
                .then(() => {})
                .catch(() => {});
        }
    }, []);
    return null;
}

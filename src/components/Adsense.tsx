"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import Script from "next/script";

export function Adsense() {
    const { user, loading } = useAuth();

    // Don't show anything while loading or if user is logged in
    if (loading || user) {
        return null;
    }

    return (
        <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3921586511397638"
            crossOrigin="anonymous"
        />
    );
}

import { Adsense } from "@/components/Adsense";

export default function ConcorsiLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Adsense />
            {children}
        </>
    );
}

"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { href: "/", label: "Releases" },
    { href: "/logs", label: "Update Logs" },
];

export function DashboardHeader() {
    const pathname = usePathname();

    return (
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
            <div className="container flex h-14 items-center gap-8">
                <Link href="/" className="flex items-center gap-2">
                    <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-primary-foreground h-4 w-4"
                        >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" x2="12" y1="15" y2="3" />
                        </svg>
                    </div>
                    <span className="font-semibold">Update Server</span>
                </Link>
                <nav className="flex items-center gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                pathname === item.href
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground",
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    );
}

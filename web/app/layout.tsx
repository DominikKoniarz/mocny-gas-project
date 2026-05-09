import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
    title: "Update Server - Electron App Releases",
    description:
        "Admin dashboard for managing Electron app releases and updates",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning className={fontSans.variable}>
            <body className="antialiased">
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    );
}

import type React from "react";
import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeStyle } from "@/components/theme-style";
import { ToastProvider } from "@/components/ui/toast";
import { getSiteSettings } from "@/lib/server/queries";
import "./globals.css";

/** App fonts — store and admin (self-hosted by next/font: no third-party requests). */
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });
const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
	const { branding } = await getSiteSettings();
	return {
		title: { default: branding.storeName, template: `%s | ${branding.storeName}` },
		description: branding.description,
		icons: { icon: branding.faviconUrl },
	};
}

export async function generateViewport(): Promise<Viewport> {
	const { theme } = await getSiteSettings();
	return { width: "device-width", initialScale: 1, themeColor: theme.background };
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { theme } = await getSiteSettings();

	return (
		<html lang="pt-BR" className={`${nunito.variable} ${fredoka.variable}`}>
			<head>
				<ThemeStyle theme={theme} />
			</head>
			<body className="font-sans antialiased">
				<ToastProvider>{children}</ToastProvider>
				<Analytics />
			</body>
		</html>
	);
}

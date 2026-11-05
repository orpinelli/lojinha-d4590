import type React from "react";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { ThemeStyle } from "@/components/theme-style";
import { ToastProvider } from "@/components/ui/toast";
import { getSiteSettings } from "@/lib/server/queries";
import "./globals.css";

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
		<html lang="pt-BR">
			<head>
				<ThemeStyle theme={theme} />
			</head>
			<body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
				<ToastProvider>{children}</ToastProvider>
				<Analytics />
			</body>
		</html>
	);
}

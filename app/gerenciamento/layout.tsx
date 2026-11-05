import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Gerenciamento",
	robots: { index: false, follow: false },
};

export default function AdminAreaLayout({ children }: { children: React.ReactNode }) {
	return children;
}

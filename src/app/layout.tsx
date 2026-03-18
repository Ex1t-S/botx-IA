import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
	title: "BOTX",
	description: "Search dead wallets cryptocurrency, best in the market.",
	icons: {
	icon: [
		{ url: "/images/favicon.ico" },
		{ url: "/images/favicon-16x16.png", sizes: "16x16", type: "image/png" },
		{ url: "/images/favicon-32x32.png", sizes: "32x32", type: "image/png" },
	],
	shortcut: "/images/favicon.ico",
	apple: "/images/apple-touch-icon.png",
},
manifest: "/images/site.webmanifest",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body suppressHydrationWarning>{children}</body>
		</html>
	);
}
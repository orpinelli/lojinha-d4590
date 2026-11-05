import type { SiteSettings } from "../domain/site-settings";

/** The store's current content, used as defaults and as the initial seed. */
export function defaultSiteSettings(): SiteSettings {
	return {
		branding: {
			storeName: "Loja D4590",
			description: "Loja de produtos do Distrito D4590",
			logoUrl: "/rotaract-logo.png",
			faviconUrl: "/logo.png",
			invertFooterLogo: true,
		},
		theme: {
			primary: "#d41367",
			primaryForeground: "#ffffff",
			background: "#ffffff",
			foreground: "#000000",
			mutedForeground: "#4b5563",
			footerBackground: "#000000",
			footerForeground: "#ffffff",
		},
		hero: {
			title: "ROTARACT",
			highlight: "DISTRITO 4590",
			subtitle:
				"Uma coleção exclusiva que celebra a excelência e o compromisso com o serviço.",
		},
		labels: {
			shipping: "Frete Grátis",
		},
		contact: {
			whatsappNumber: "5519991801697",
			orderGreeting: "Olá! Gostaria de fazer o seguinte pedido:",
			instagramUrl: "https://www.instagram.com/rotaract4590/",
		},
		footer: {
			copyright: "© 2025 ROTARACT DISTRITO 4590. TODOS OS DIREITOS RESERVADOS.",
		},
	};
}

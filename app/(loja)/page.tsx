import { FeaturedProducts } from "@/components/store/featured-products";
import { ProductCollection } from "@/components/store/product-collection";
import { CategorySection, Hero, SiteFooter } from "@/components/store/sections";
import { SiteHeader, type SiteNavItem } from "@/components/store/site-header";
import { getSiteSettings, getStorefront } from "@/lib/server/queries";
import { slugify } from "@/modules/shared/domain/text";

/** Unique, readable anchors per category (e.g. #vestuario). */
function toNavItems(categories: { id: string; name: string }[]): SiteNavItem[] {
	const used = new Set<string>();
	return categories.map(({ id, name }) => {
		let anchor = slugify(name) || `categoria-${id}`;
		while (used.has(anchor)) anchor = `${anchor}-${id}`;
		used.add(anchor);
		return { id: anchor, label: name };
	});
}

export default async function HomePage() {
	const [{ sections, featured }, { branding, hero, contact, footer }] = await Promise.all([
		getStorefront(),
		getSiteSettings(),
	]);
	const navItems = toNavItems(sections.map((section) => section.category));

	return (
		<div className="min-h-screen overflow-x-hidden bg-background">
			<SiteHeader.Root position="fixed">
				<SiteHeader.Bar>
					<SiteHeader.Brand />
					<SiteHeader.Nav items={navItems} />
					<SiteHeader.Actions>
						<SiteHeader.CartButton />
						<SiteHeader.MenuToggle hasItems={navItems.length > 0} />
					</SiteHeader.Actions>
				</SiteHeader.Bar>
				<SiteHeader.MobileNav items={navItems} />
			</SiteHeader.Root>

			<main>
				<Hero.Root>
					<Hero.Title>
						{hero.title}
						{hero.highlight && <Hero.Highlight>{hero.highlight}</Hero.Highlight>}
					</Hero.Title>
					{hero.subtitle && <Hero.Subtitle>{hero.subtitle}</Hero.Subtitle>}
				</Hero.Root>

				<FeaturedProducts products={featured} />

				{sections.map(({ category, products }, index) => (
					<CategorySection.Root key={category.id} id={navItems[index].id}>
						<CategorySection.Title>{category.name}</CategorySection.Title>
						<ProductCollection products={products} />
					</CategorySection.Root>
				))}

				{sections.length === 0 && (
					<p className="px-4 py-16 text-center text-muted-foreground">
						Nenhum produto disponível no momento.
					</p>
				)}
			</main>

			<SiteFooter.Root>
				<SiteFooter.Brand
					logoUrl={branding.logoUrl}
					alt={branding.storeName}
					invert={branding.invertFooterLogo}
				/>
				<SiteFooter.Social instagramUrl={contact.instagramUrl} />
				<SiteFooter.Copyright>{footer.copyright}</SiteFooter.Copyright>
			</SiteFooter.Root>
		</div>
	);
}

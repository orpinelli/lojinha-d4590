import { Hero, SiteFooter } from "@/components/store/sections";
import { FeaturedShowcase, ShowcaseBlock } from "@/components/store/showcases";
import { SiteHeader, type SiteNavItem } from "@/components/store/site-header";
import { getHomeShowcases, getSiteSettings } from "@/lib/server/queries";
import { slugify } from "@/modules/shared/domain/text";

/** Unique, readable anchors per showcase (e.g. #vestuario). */
function toAnchors(showcases: { id: string; title: string }[]): Map<string, string> {
	const used = new Set<string>();
	return new Map(
		showcases.map(({ id, title }) => {
			let anchor = slugify(title) || `vitrine-${id}`;
			while (used.has(anchor)) anchor = `${anchor}-${slugify(id)}`;
			used.add(anchor);
			return [id, anchor];
		}),
	);
}

export default async function HomePage() {
	const [showcases, { branding, hero, contact, footer }] = await Promise.all([
		getHomeShowcases(),
		getSiteSettings(),
	]);
	const anchors = toAnchors(showcases.map(({ showcase }) => showcase));
	const navItems: SiteNavItem[] = showcases
		.filter(({ showcase }) => showcase.layout !== "featured")
		.map(({ showcase }) => ({ id: anchors.get(showcase.id) ?? showcase.id, label: showcase.title }));

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

				{showcases.map(({ showcase, products }, index) =>
					showcase.layout === "featured" ? (
						<FeaturedShowcase
							key={showcase.id}
							title={showcase.title}
							products={products}
							priority={index === 0}
						/>
					) : (
						<ShowcaseBlock
							key={showcase.id}
							anchor={anchors.get(showcase.id) ?? showcase.id}
							title={showcase.title}
							layout={showcase.layout}
							products={products}
						/>
					),
				)}

				{showcases.length === 0 && (
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

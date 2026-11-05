import {
	SiteHeaderActions,
	SiteHeaderBackButton,
	SiteHeaderBar,
	SiteHeaderBrand,
	SiteHeaderCartButton,
	SiteHeaderMenuToggle,
	SiteHeaderMobileNav,
	SiteHeaderNav,
	SiteHeaderRoot,
} from "./site-header";

export type { SiteNavItem } from "./site-header";

export const SiteHeader = {
	Root: SiteHeaderRoot,
	Bar: SiteHeaderBar,
	Brand: SiteHeaderBrand,
	Nav: SiteHeaderNav,
	MobileNav: SiteHeaderMobileNav,
	Actions: SiteHeaderActions,
	CartButton: SiteHeaderCartButton,
	MenuToggle: SiteHeaderMenuToggle,
	BackButton: SiteHeaderBackButton,
};

import type { ProductDetails as Details } from "@/modules/catalog/domain/product";
import { SectionLabel } from "@/components/ui/section-label";

/** Structured details list (replaces the old raw-HTML `detailHtml`). */
export function ProductDetails({
	details,
	description,
}: {
	details: Details;
	description: string;
}) {
	const hasItems = details.items.length > 0;
	return (
		<div className="space-y-4 rounded-2xl border-2 p-5 sm:p-6">
			<SectionLabel>{(hasItems && details.title) || "Descrição do produto"}</SectionLabel>
			{hasItems ? (
				<ul className="space-y-2.5">
					{details.items.map((item, index) => (
						<li key={index} className="flex gap-3 text-[15px] font-semibold break-words text-foreground">
							<span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
							{item}
						</li>
					))}
				</ul>
			) : (
				<p className="text-base leading-relaxed break-words text-muted-foreground">{description}</p>
			)}
		</div>
	);
}

import type { ProductDetails as Details } from "@/modules/catalog/domain/product";

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
		<div className="space-y-5 border-t pt-6 sm:space-y-6 sm:pt-8">
			<h2 className="text-xl font-light tracking-tight text-foreground sm:text-2xl">
				{(hasItems && details.title) || "Descrição do Produto"}
			</h2>
			{hasItems ? (
				<ul className="list-disc space-y-2 pl-5 font-light text-muted-foreground">
					{details.items.map((item, index) => (
						<li key={index} className="break-words">
							{item}
						</li>
					))}
				</ul>
			) : (
				<p className="text-base leading-relaxed font-light break-words text-muted-foreground sm:text-lg">
					{description}
				</p>
			)}
		</div>
	);
}

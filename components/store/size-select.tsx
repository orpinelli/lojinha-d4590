import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** The single size picker used by cards, featured product and product page. */
export function SizeSelect({
	sizes,
	value,
	onValueChange,
	placeholder = "Selecione o tamanho",
	triggerClassName,
	label = "Tamanho",
}: {
	sizes: string[];
	value: string;
	onValueChange: (size: string) => void;
	placeholder?: string;
	triggerClassName?: string;
	label?: string;
}) {
	return (
		<Select value={value} onValueChange={onValueChange}>
			<SelectTrigger aria-label={label} className={cn("w-full", triggerClassName)}>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				{sizes.map((size) => (
					<SelectItem key={size} value={size}>
						{size}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

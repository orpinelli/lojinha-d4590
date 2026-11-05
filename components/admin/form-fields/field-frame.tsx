"use client";

import type { ReactNode } from "react";
import {
	FormControl,
	FormDescription,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";

export type BaseFieldProps = {
	name: string;
	label: string;
	description?: ReactNode;
	className?: string;
};

/**
 * Shared label/description/error frame for every field. `asControl={false}`
 * lets complex fields place <FormControl> on their own focusable element.
 */
export function FieldFrame({
	label,
	description,
	className,
	asControl = true,
	children,
}: Omit<BaseFieldProps, "name"> & { asControl?: boolean; children: ReactNode }) {
	return (
		<FormItem className={className}>
			<FormLabel>{label}</FormLabel>
			{asControl ? <FormControl>{children}</FormControl> : children}
			{description && <FormDescription>{description}</FormDescription>}
			<FormMessage />
		</FormItem>
	);
}

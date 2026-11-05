"use client";

import type { ComponentProps } from "react";
import { useFormContext } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/modules/shared/domain/money";
import { FieldFrame, type BaseFieldProps } from "./field-frame";

type InputProps = Omit<ComponentProps<typeof Input>, "name" | "value" | "onChange" | "defaultValue">;

export function TextField({ name, label, description, className, ...inputProps }: BaseFieldProps & InputProps) {
	const { control } = useFormContext();
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FieldFrame label={label} description={description} className={className}>
					<Input {...inputProps} {...field} value={field.value ?? ""} />
				</FieldFrame>
			)}
		/>
	);
}

export function TextareaField({
	name,
	label,
	description,
	className,
	rows = 3,
	placeholder,
}: BaseFieldProps & { rows?: number; placeholder?: string }) {
	const { control } = useFormContext();
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FieldFrame label={label} description={description} className={className}>
					<Textarea {...field} value={field.value ?? ""} rows={rows} placeholder={placeholder} />
				</FieldFrame>
			)}
		/>
	);
}

export function NumberField({ name, label, description, className }: BaseFieldProps) {
	const { control } = useFormContext();
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FieldFrame label={label} description={description} className={className}>
					<Input
						type="number"
						inputMode="numeric"
						min={0}
						step={1}
						name={field.name}
						ref={field.ref}
						onBlur={field.onBlur}
						value={Number.isFinite(field.value) ? field.value : ""}
						onChange={(event) =>
							field.onChange(event.target.value === "" ? Number.NaN : event.target.valueAsNumber)
						}
					/>
				</FieldFrame>
			)}
		/>
	);
}

/** Currency mask: typing digits fills from the cents (2 → R$ 0,02 → R$ 0,25…). */
export function MoneyField({ name, label, description, className }: BaseFieldProps) {
	const { control } = useFormContext();
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FieldFrame label={label} description={description} className={className}>
					<Input
						inputMode="numeric"
						autoComplete="off"
						name={field.name}
						ref={field.ref}
						onBlur={field.onBlur}
						value={formatPrice(Number(field.value) || 0)}
						onChange={(event) => {
							const digits = event.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 9);
							field.onChange(digits ? Number.parseInt(digits, 10) : 0);
						}}
					/>
				</FieldFrame>
			)}
		/>
	);
}

export function SelectField({
	name,
	label,
	description,
	className,
	placeholder = "Selecione",
	options,
}: BaseFieldProps & { placeholder?: string; options: { value: string; label: string }[] }) {
	const { control } = useFormContext();
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FieldFrame label={label} description={description} className={className} asControl={false}>
					<Select value={field.value ?? ""} onValueChange={field.onChange}>
						<FormControl>
							<SelectTrigger ref={field.ref} onBlur={field.onBlur} className="w-full">
								<SelectValue placeholder={placeholder} />
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{options.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</FieldFrame>
			)}
		/>
	);
}

export function SwitchField({ name, label, description, className }: BaseFieldProps) {
	const { control } = useFormContext();
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem
					className={cn("flex items-center justify-between gap-4 rounded-lg border p-3 sm:p-4", className)}
				>
					<div className="min-w-0 space-y-1">
						<FormLabel className="leading-snug">{label}</FormLabel>
						{description && <FormDescription>{description}</FormDescription>}
						<FormMessage />
					</div>
					<FormControl>
						<Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} onBlur={field.onBlur} ref={field.ref} />
					</FormControl>
				</FormItem>
			)}
		/>
	);
}

const HEX = /^#[0-9a-fA-F]{6}$/;

export function ColorField({ name, label, description, className }: BaseFieldProps) {
	const { control } = useFormContext();
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FieldFrame label={label} description={description} className={className} asControl={false}>
					<div className="flex items-center gap-2">
						<input
							type="color"
							aria-label={`${label}: seletor de cor`}
							value={HEX.test(field.value ?? "") ? String(field.value).toLowerCase() : "#000000"}
							onChange={(event) => field.onChange(event.target.value)}
							className="h-10 w-12 shrink-0 cursor-pointer rounded-md border bg-background p-1"
						/>
						<FormControl>
							<Input
								name={field.name}
								ref={field.ref}
								onBlur={field.onBlur}
								value={field.value ?? ""}
								onChange={(event) => field.onChange(event.target.value.trim())}
								maxLength={7}
								spellCheck={false}
								autoCapitalize="off"
								className="font-mono uppercase"
							/>
						</FormControl>
					</div>
				</FieldFrame>
			)}
		/>
	);
}

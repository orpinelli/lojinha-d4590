"use client";

import Image from "next/image";
import { useRef, useState, type ComponentProps, type ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { ImageIcon, ImagePlus, Loader2, Plus, Star, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormControl, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Sortable, SortableHandle, SortableItem } from "@/components/ui/sortable";
import { useImageUpload } from "@/hooks/use-image-upload";
import { cn } from "@/lib/utils";
import { DEFAULT_SIZES } from "@/modules/catalog/domain/product";
import { ACCEPTED_IMAGE_TYPES } from "@/modules/media/domain/media";
import { FieldFrame, type BaseFieldProps } from "./field-frame";

function HiddenFileInput({
	inputRef,
	multiple,
	onFiles,
}: {
	inputRef: React.RefObject<HTMLInputElement | null>;
	multiple?: boolean;
	onFiles: (files: File[]) => void;
}) {
	return (
		<input
			ref={inputRef}
			type="file"
			accept={ACCEPTED_IMAGE_TYPES}
			multiple={multiple}
			tabIndex={-1}
			aria-hidden
			className="sr-only"
			onChange={(event) => {
				const files = Array.from(event.target.files ?? []);
				event.target.value = "";
				onFiles(files);
			}}
		/>
	);
}

const neutralButton = "hover:bg-muted hover:text-foreground";

/** Toggle button shared by sizes and category pickers. */
export function ToggleChip({
	pressed,
	className,
	...props
}: ComponentProps<"button"> & { pressed: boolean }) {
	return (
		<button
			type="button"
			aria-pressed={pressed}
			className={cn(
				"min-h-10 min-w-12 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
				pressed ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
				className,
			)}
			{...props}
		/>
	);
}

/** Single image (logo, favicon). */
export function ImageField({
	name,
	label,
	description,
	className,
	previewClassName,
}: BaseFieldProps & { previewClassName?: string }) {
	const { control } = useFormContext();
	const { upload, uploading } = useImageUpload();
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FieldFrame label={label} description={description} className={className} asControl={false}>
					<div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center">
						<div
							className={cn(
								"relative flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted min-[420px]:w-40",
								previewClassName,
							)}
						>
							{field.value ? (
								<Image src={field.value} alt="" fill sizes="160px" className="object-contain p-2" />
							) : (
								<ImageIcon className="size-6 text-muted-foreground" />
							)}
						</div>
						<FormControl>
							<Button
								type="button"
								variant="outline"
								disabled={uploading}
								onClick={() => inputRef.current?.click()}
								onBlur={field.onBlur}
								className={neutralButton}
							>
								{uploading ? <Loader2 className="animate-spin" /> : <Upload />}
								{uploading ? "Enviando..." : field.value ? "Trocar imagem" : "Enviar imagem"}
							</Button>
						</FormControl>
					</div>
					<HiddenFileInput
						inputRef={inputRef}
						onFiles={async (files) => {
							const [url] = await upload(files.slice(0, 1));
							if (url) field.onChange(url);
						}}
					/>
				</FieldFrame>
			)}
		/>
	);
}

function TileButton({
	label,
	onClick,
	disabled,
	destructive,
	children,
}: {
	label: string;
	onClick: () => void;
	disabled?: boolean;
	destructive?: boolean;
	children: ReactNode;
}) {
	return (
		<Button
			type="button"
			variant="ghost"
			aria-label={label}
			title={label}
			disabled={disabled}
			onClick={onClick}
			className={cn(
				"size-9 p-0",
				destructive ? "text-destructive hover:bg-destructive/10 hover:text-destructive" : neutralButton,
			)}
		>
			{children}
		</Button>
	);
}

/** Stable, unique ids for possibly repeated URLs (needed by drag and drop). */
function imageIds(images: string[]): string[] {
	const seen = new Map<string, number>();
	return images.map((url) => {
		const count = seen.get(url) ?? 0;
		seen.set(url, count + 1);
		return `${url}#${count}`;
	});
}

/** Ordered gallery: drag to reorder; the first image is the cover. */
export function ImageListField({
	name,
	label,
	description,
	className,
	max = 12,
}: BaseFieldProps & { max?: number }) {
	const { control, getValues } = useFormContext();
	const { upload, uploading } = useImageUpload();
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				const images: string[] = field.value ?? [];
				const ids = imageIds(images);
				const byId = new Map(ids.map((id, index) => [id, images[index]]));
				const moveToFront = (index: number) =>
					field.onChange([images[index], ...images.filter((_, i) => i !== index)]);

				return (
					<FieldFrame label={label} description={description} className={className} asControl={false}>
						<Sortable
							ids={ids}
							layout="grid"
							getLabel={(id) => `Imagem ${ids.indexOf(id) + 1}`}
							onReorder={(next) => field.onChange(next.map((id) => byId.get(id) ?? ""))}
						>
							<div className="grid grid-cols-2 gap-3 min-[560px]:grid-cols-3 md:grid-cols-4">
								{images.map((url, index) => (
									<SortableItem
										key={ids[index]}
										id={ids[index]}
										className="overflow-hidden rounded-lg border bg-muted"
									>
										<div className="relative aspect-square">
											<Image src={url} alt={`Imagem ${index + 1}`} fill sizes="200px" className="object-cover" />
										</div>
										{index === 0 && (
											<span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
												Capa
											</span>
										)}
										<div className="flex items-center justify-between gap-1 border-t bg-background p-1">
											<SortableHandle label={`Mover imagem ${index + 1}`} className="size-9" />
											<TileButton label="Usar como capa" disabled={index === 0} onClick={() => moveToFront(index)}>
												<Star className="size-4" />
											</TileButton>
											<TileButton
												label="Remover imagem"
												destructive
												onClick={() => field.onChange(images.filter((_, i) => i !== index))}
											>
												<Trash2 className="size-4" />
											</TileButton>
										</div>
									</SortableItem>
								))}
								{images.length < max && (
									<FormControl>
										<button
											type="button"
											disabled={uploading}
											onClick={() => inputRef.current?.click()}
											onBlur={field.onBlur}
											className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-2 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
										>
											{uploading ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
											<span>{uploading ? "Enviando..." : "Adicionar imagens"}</span>
										</button>
									</FormControl>
								)}
							</div>
						</Sortable>
						<HiddenFileInput
							inputRef={inputRef}
							multiple
							onFiles={async (files) => {
								const current: string[] = getValues(name) ?? [];
								const urls = await upload(files.slice(0, Math.max(0, max - current.length)));
								if (urls.length) field.onChange([...(getValues(name) ?? []), ...urls]);
							}}
						/>
					</FieldFrame>
				);
			}}
		/>
	);
}

/** Editable list of short texts (product details bullet points). */
export function StringListField({
	name,
	label,
	description,
	className,
	placeholder,
	addLabel = "Adicionar item",
	max = 30,
}: BaseFieldProps & { placeholder?: string; addLabel?: string; max?: number }) {
	const { control, getFieldState, formState } = useFormContext();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				const items: string[] = field.value ?? [];
				const update = (index: number, value: string) =>
					field.onChange(items.map((item, i) => (i === index ? value : item)));

				return (
					<FieldFrame label={label} description={description} className={className} asControl={false}>
						<div className="space-y-2">
							{items.map((item, index) => {
								const error = getFieldState(`${name}.${index}`, formState).error;
								return (
									<div key={index}>
										<div className="flex items-center gap-2">
											<Input
												value={item}
												onChange={(event) => update(index, event.target.value)}
												placeholder={placeholder}
												aria-label={`${label} ${index + 1}`}
												aria-invalid={Boolean(error)}
												maxLength={160}
											/>
											<Button
												type="button"
												variant="ghost"
												aria-label={`Remover item ${index + 1}`}
												onClick={() => field.onChange(items.filter((_, i) => i !== index))}
												className="size-10 shrink-0 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
											>
												<X className="size-4" />
											</Button>
										</div>
										{error?.message && <p className="mt-1 text-sm text-destructive">{error.message}</p>}
									</div>
								);
							})}
							{items.length < max && (
								<FormControl>
									<Button
										type="button"
										variant="outline"
										onClick={() => field.onChange([...items, ""])}
										className={neutralButton}
									>
										<Plus /> {addLabel}
									</Button>
								</FormControl>
							)}
						</div>
					</FieldFrame>
				);
			}}
		/>
	);
}

/** Multi-select as toggle chips; keeps the order in which items were chosen. */
export function ChipsField({
	name,
	label,
	description,
	className,
	options,
	emptyMessage = "Nenhuma opção disponível.",
}: BaseFieldProps & { options: { value: string; label: string }[]; emptyMessage?: string }) {
	const { control } = useFormContext();
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				const selected: string[] = field.value ?? [];
				const toggle = (value: string) =>
					field.onChange(
						selected.includes(value)
							? selected.filter((item) => item !== value)
							: [...selected, value],
					);
				return (
					<FieldFrame label={label} description={description} className={className} asControl={false}>
						{options.length === 0 ? (
							<p className="text-sm text-muted-foreground">{emptyMessage}</p>
						) : (
							<FormControl>
								<div role="group" aria-label={label} className="flex flex-wrap gap-2">
									{options.map((option) => (
										<ToggleChip
											key={option.value}
											pressed={selected.includes(option.value)}
											onClick={() => toggle(option.value)}
										>
											{option.label}
										</ToggleChip>
									))}
								</div>
							</FormControl>
						)}
					</FieldFrame>
				);
			}}
		/>
	);
}

const DEFAULTS: readonly string[] = DEFAULT_SIZES;

function orderSizes(sizes: string[]): string[] {
	const standard = DEFAULTS.filter((size) => sizes.includes(size));
	const custom = sizes.filter((size) => !DEFAULTS.includes(size));
	return [...standard, ...custom];
}

/** Toggle standard sizes (PP…XG) and add custom ones. */
export function SizesField({ name, label, description, className }: BaseFieldProps) {
	const { control } = useFormContext();
	const [custom, setCustom] = useState("");

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				const selected: string[] = field.value ?? [];
				const toggle = (size: string) =>
					field.onChange(
						selected.includes(size)
							? selected.filter((value) => value !== size)
							: orderSizes([...selected, size]),
					);
				const addCustom = () => {
					const value = custom.trim().toUpperCase();
					setCustom("");
					if (value && !selected.includes(value)) field.onChange([...selected, value]);
				};
				const options = [...DEFAULTS, ...selected.filter((size) => !DEFAULTS.includes(size))];

				return (
					<FieldFrame label={label} description={description} className={className} asControl={false}>
						<div className="space-y-3">
							<FormControl>
								<div role="group" aria-label={label} className="flex flex-wrap gap-2">
									{options.map((size) => (
										<ToggleChip key={size} pressed={selected.includes(size)} onClick={() => toggle(size)}>
											{size}
										</ToggleChip>
									))}
								</div>
							</FormControl>
							<div className="flex gap-2">
								<Input
									value={custom}
									onChange={(event) => setCustom(event.target.value)}
									onKeyDown={(event) => {
										if (event.key === "Enter") {
											event.preventDefault();
											addCustom();
										}
									}}
									placeholder="Outro tamanho (ex.: 2XG)"
									maxLength={10}
									aria-label="Adicionar outro tamanho"
								/>
								<Button type="button" variant="outline" onClick={addCustom} className={cn("shrink-0", neutralButton)}>
									Adicionar
								</Button>
							</div>
						</div>
					</FieldFrame>
				);
			}}
		/>
	);
}

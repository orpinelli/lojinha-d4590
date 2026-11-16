"use client";

import { useRef, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import {
	formatWhatsapp,
	limitWhatsappDigits,
	normalizeWhatsapp,
	onlyDigits,
} from "@/modules/shared/domain/phone";

/** Cursor position in the masked text right after the n-th digit. */
function positionAfterDigits(masked: string, count: number): number {
	let position = 0;
	for (let seen = 0; position < masked.length && seen < count; position++) {
		if (/\d/.test(masked[position])) seen++;
	}
	return position;
}

type PhoneInputProps = Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type" | "defaultValue"> & {
	/** Digits only (what gets stored). */
	value: string;
	onValueChange: (digits: string) => void;
};

/**
 * Phone/WhatsApp input with a mask, used by the store and the admin. Any typing
 * style is accepted (+, spaces, dashes, parentheses) and shown as
 * "+55 19 99166-6588"; only the digits are reported. On leaving the field a
 * Brazilian number typed without the 55 gets it added.
 */
export function PhoneInput({
	value,
	onValueChange,
	onBlur,
	ref,
	placeholder = "+55 19 99999-9999",
	autoComplete = "tel",
	...props
}: PhoneInputProps) {
	const inputRef = useRef<HTMLInputElement | null>(null);

	return (
		<Input
			{...props}
			ref={(element) => {
				inputRef.current = element;
				if (typeof ref === "function") ref(element);
				else if (ref) ref.current = element;
			}}
			type="tel"
			inputMode="tel"
			autoComplete={autoComplete}
			placeholder={placeholder}
			value={formatWhatsapp(value)}
			onBlur={(event) => {
				onValueChange(normalizeWhatsapp(value));
				onBlur?.(event);
			}}
			onChange={(event) => {
				const input = event.target;
				const previous = onlyDigits(value);
				let digits = onlyDigits(input.value);
				let caret = onlyDigits(input.value.slice(0, input.selectionStart ?? input.value.length)).length;
				// Backspace right after a space or dash: delete the digit before it
				const deletedSeparator =
					digits === previous && (event.nativeEvent as InputEvent).inputType === "deleteContentBackward";
				if (deletedSeparator && caret > 0) {
					digits = digits.slice(0, caret - 1) + digits.slice(caret);
					caret -= 1;
				}
				digits = limitWhatsappDigits(digits);
				caret = Math.min(caret, digits.length);
				onValueChange(digits);
				// Once the mask is reapplied, keep the cursor after the same digit
				requestAnimationFrame(() => {
					const element = inputRef.current;
					if (element && document.activeElement === element) {
						const position = positionAfterDigits(element.value, caret);
						element.setSelectionRange(position, position);
					}
				});
			}}
		/>
	);
}

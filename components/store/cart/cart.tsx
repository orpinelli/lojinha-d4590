"use client";

import Link from "next/link";
import {
	createContext,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
	type ComponentProps,
	type ReactNode,
	type RefObject,
} from "react";
import { CircleCheck, MessageCircle, ShoppingCart, Trash2 } from "lucide-react";
import { Price } from "@/components/store/price";
import { PRODUCT_PHOTO_FRAME, ProductPhoto } from "@/components/store/product-photo";
import { QuantityStepper } from "@/components/store/quantity-stepper";
import { ShippingBadge } from "@/components/store/store-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { RadioCard } from "@/components/ui/radio-card";
import { SectionLabel } from "@/components/ui/section-label";
import { useCart, type CartItem } from "@/contexts/cart-context";
import { useSiteSettings } from "@/contexts/site-settings-context";
import { useCheckout, type CheckoutCustomer, type PlacedOrder } from "@/hooks/use-checkout";
import { cn } from "@/lib/utils";
import { productPath } from "@/modules/catalog/domain/product";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/modules/orders/domain/order";
import { isValidWhatsapp, normalizeWhatsapp, onlyDigits } from "@/modules/shared/domain/phone";

/*
 * Cart page parts. Each state part (Loading, Empty, Review, Placed) renders
 * only in its own state, so a page composes all of them and the right one shows.
 */

/** The customer details are remembered in this browser for the next order. */
const CUSTOMER_KEY = "rotaract-customer";

const EMPTY_CUSTOMER: CheckoutCustomer = { name: "", club: "", district: "", phone: "" };

type CartPageContextValue = {
	placed: PlacedOrder | null;
	checkout: () => void;
	/** Required: chosen before finishing (null = not chosen yet). */
	paymentMethod: PaymentMethod | null;
	setPaymentMethod: (method: PaymentMethod) => void;
	paymentError: string | null;
	paymentGroupRef: RefObject<HTMLDivElement | null>;
	/** Optional details typed by the visitor (phone as digits). */
	customer: CheckoutCustomer;
	setCustomer: (changes: Partial<CheckoutCustomer>) => void;
	phoneError: string | null;
	phoneInputRef: RefObject<HTMLInputElement | null>;
};

const PAYMENT_ERROR = "Escolha a forma de pagamento.";
const PHONE_ERROR = "Confira o número com DDD, ou deixe em branco.";

const savedText = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");

function readSavedCustomer(): CheckoutCustomer | null {
	try {
		const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) ?? "null") as Partial<CheckoutCustomer> | null;
		if (!saved || typeof saved.name !== "string" || typeof saved.phone !== "string") return null;
		return {
			name: savedText(saved.name, 120),
			// Saved before these fields existed: start empty.
			club: savedText(saved.club, 120),
			district: savedText(saved.district, 60),
			phone: onlyDigits(saved.phone).slice(0, 15),
		};
	} catch {
		return null; // blocked or corrupted storage: start empty
	}
}

const CartPageContext = createContext<CartPageContextValue | null>(null);

function useCartPage() {
	const context = useContext(CartPageContext);
	if (!context) throw new Error("Use as partes do Cart dentro de <Cart.Root>");
	return context;
}

type CartState = "loading" | "empty" | "review" | "placed";

function useCartState(): CartState {
	const { ready, items } = useCart();
	const { placed } = useCartPage();
	if (placed) return "placed";
	if (!ready) return "loading";
	return items.length === 0 ? "empty" : "review";
}

export function CartRoot({ children }: { children: ReactNode }) {
	const runCheckout = useCheckout();
	const [placed, setPlaced] = useState<PlacedOrder | null>(null);
	const [paymentMethod, setPaymentMethodState] = useState<PaymentMethod | null>(null);
	const [paymentError, setPaymentError] = useState<string | null>(null);
	const paymentGroupRef = useRef<HTMLDivElement | null>(null);
	const [customer, setCustomerState] = useState<CheckoutCustomer>(EMPTY_CUSTOMER);
	const [customerLoaded, setCustomerLoaded] = useState(false);
	const [phoneError, setPhoneError] = useState<string | null>(null);
	const phoneInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		const saved = readSavedCustomer();
		if (saved) setCustomerState(saved);
		setCustomerLoaded(true);
	}, []);

	useEffect(() => {
		// Only after loading, otherwise the empty initial state would erase what was saved.
		if (!customerLoaded) return;
		try {
			localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
		} catch {
			// Private mode / blocked storage: works for this visit only.
		}
	}, [customer, customerLoaded]);

	const setPaymentMethod = (method: PaymentMethod) => {
		setPaymentMethodState(method);
		setPaymentError(null);
	};

	const setCustomer = (changes: Partial<CheckoutCustomer>) => {
		setCustomerState((current) => ({ ...current, ...changes }));
		if (changes.phone !== undefined) setPhoneError(null);
	};

	/**
	 * The phone is optional, but when filled it must be a real number. Checked only
	 * when finishing: validating on blur would show the message right as the button
	 * is pressed, pushing it down so the click misses.
	 */
	const validatePhone = () => {
		const phone = normalizeWhatsapp(customer.phone);
		const valid = phone === "" || isValidWhatsapp(phone);
		setPhoneError(valid ? null : PHONE_ERROR);
		return valid;
	};

	const checkout = () => {
		setPaymentError(paymentMethod ? null : PAYMENT_ERROR);
		const phoneValid = validatePhone();
		if (!paymentMethod) {
			// The payment comes first on the page: start there.
			paymentGroupRef.current?.querySelector<HTMLInputElement>("input")?.focus();
			return;
		}
		if (!phoneValid) {
			phoneInputRef.current?.focus();
			return;
		}
		const order = runCheckout(paymentMethod, {
			name: customer.name.trim(),
			club: customer.club.trim(),
			district: customer.district.trim(),
			phone: normalizeWhatsapp(customer.phone),
		});
		if (order) {
			setPlaced(order);
			window.scrollTo({ top: 0 });
		}
	};

	return (
		<CartPageContext.Provider
			value={{
				placed,
				checkout,
				paymentMethod,
				setPaymentMethod,
				paymentError,
				paymentGroupRef,
				customer,
				setCustomer,
				phoneError,
				phoneInputRef,
			}}
		>
			<div className="space-y-6 sm:space-y-8">{children}</div>
		</CartPageContext.Provider>
	);
}

/** Title + item count (the confirmation screen has its own heading). */
export function CartHeader() {
	const { count } = useCart();
	const state = useCartState();
	if (state === "placed") return null;
	return (
		<div className="space-y-1.5">
			<h1 className="font-display text-3xl leading-tight font-semibold text-foreground sm:text-4xl">
				Seu carrinho
			</h1>
			<p className="text-[15px] text-muted-foreground">
				{state === "review"
					? `${count} ${count === 1 ? "item" : "itens"} · confira tudo antes de finalizar.`
					: "Os produtos que você adicionar aparecem aqui."}
			</p>
		</div>
	);
}

export function CartLoading() {
	if (useCartState() !== "loading") return null;
	return (
		<div aria-busy="true" aria-label="Carregando o carrinho" className="space-y-3">
			{[0, 1].map((key) => (
				<div key={key} className="h-28 animate-pulse rounded-2xl bg-muted" />
			))}
		</div>
	);
}

export function CartEmpty() {
	if (useCartState() !== "empty") return null;
	return (
		<div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center">
			<span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
				<ShoppingCart className="size-7" strokeWidth={2.5} />
			</span>
			<p className="font-display text-2xl font-semibold text-foreground">Seu carrinho está vazio</p>
			<p className="max-w-sm text-sm text-muted-foreground">Escolha um produto na loja para começar.</p>
			<Button asChild size="lg" className="mt-3">
				<Link href="/">Ver produtos</Link>
			</Button>
		</div>
	);
}

/** Two columns on desktop: items on the left, sticky summary on the right. */
export function CartReview({ className, ...props }: ComponentProps<"div">) {
	if (useCartState() !== "review") return null;
	return (
		<div
			className={cn(
				"grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10",
				className,
			)}
			{...props}
		/>
	);
}

function CartLine({ item }: { item: CartItem }) {
	const { updateQuantity, removeItem } = useCart();
	const href = productPath({ id: item.productId });
	return (
		<li className="flex gap-3 rounded-2xl border-2 p-3 sm:gap-4 sm:p-4">
			<Link
				href={href}
				className={cn("relative size-20 shrink-0 overflow-hidden rounded-xl sm:size-24", PRODUCT_PHOTO_FRAME)}
				tabIndex={-1}
				aria-hidden
			>
				{item.image && <ProductPhoto src={item.image} sizes="96px" />}
			</Link>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<div className="flex items-start justify-between gap-2">
					<Link
						href={href}
						className="line-clamp-2 font-bold text-foreground underline-offset-4 hover:underline sm:text-lg"
					>
						{item.name}
					</Link>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => removeItem(item.productId, item.size)}
						aria-label={`Remover ${item.name}${item.size ? ` (tamanho ${item.size})` : ""}`}
						className="-mt-1 -mr-1 size-9 shrink-0 text-label hover:bg-destructive/10 hover:text-destructive"
					>
						<Trash2 />
					</Button>
				</div>
				{item.size && (
					<p className="text-xs font-bold tracking-[0.5px] text-label uppercase">Tamanho {item.size}</p>
				)}
				<div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-2 pt-2">
					<QuantityStepper
						size="sm"
						min={1}
						value={item.quantity}
						itemLabel={item.name}
						onDecrement={() => updateQuantity(item.productId, item.quantity - 1, item.size)}
						onIncrement={() => updateQuantity(item.productId, item.quantity + 1, item.size)}
					/>
					<div className="text-right">
						<Price
							cents={item.priceInCents * item.quantity}
							className="block font-display text-xl font-semibold text-primary"
						/>
						{item.quantity > 1 && (
							<span className="text-xs font-semibold text-muted-foreground">
								<Price cents={item.priceInCents} className="text-muted-foreground" /> cada
							</span>
						)}
					</div>
				</div>
			</div>
		</li>
	);
}

export function CartLines() {
	const { items } = useCart();
	return (
		<ul aria-label="Itens do carrinho" className="space-y-3">
			{items.map((item) => (
				<CartLine key={`${item.productId}-${item.size ?? ""}`} item={item} />
			))}
		</ul>
	);
}

/** Required choice: Pix, credit card or debit card. */
export function CartPayment() {
	const { paymentMethod, setPaymentMethod, paymentError, paymentGroupRef } = useCartPage();
	const titleId = useId();
	const errorId = useId();
	const name = useId();
	return (
		<div
			ref={paymentGroupRef}
			role="radiogroup"
			aria-labelledby={titleId}
			aria-required
			aria-invalid={paymentError ? true : undefined}
			aria-describedby={paymentError ? errorId : undefined}
			className="space-y-3 border-t-2 pt-5"
		>
			<p id={titleId} className="text-sm font-extrabold text-foreground">
				Forma de pagamento
			</p>
			<div className="grid gap-2">
				{PAYMENT_METHODS.map((method) => (
					<RadioCard
						key={method}
						name={name}
						value={method}
						checked={paymentMethod === method}
						onChange={() => setPaymentMethod(method)}
						className={cn("items-center py-2.5", paymentError && "border-destructive/60")}
					>
						<span className="text-sm font-extrabold text-foreground">{PAYMENT_METHOD_LABELS[method]}</span>
					</RadioCard>
				))}
			</div>
			{paymentError && (
				<p id={errorId} role="alert" className="text-sm font-bold text-destructive">
					{paymentError}
				</p>
			)}
		</div>
	);
}

/** Optional name, club, district and phone: only feed the store's order history. */
export function CartCustomer() {
	const { customer, setCustomer, phoneError, phoneInputRef } = useCartPage();
	const titleId = useId();
	const nameId = useId();
	const clubId = useId();
	const districtId = useId();
	const phoneId = useId();
	const errorId = useId();
	return (
		<div role="group" aria-labelledby={titleId} className="space-y-4 border-t-2 pt-5">
			<p id={titleId} className="text-sm font-extrabold text-foreground">
				Seus dados <span className="font-semibold text-muted-foreground">(opcional)</span>
			</p>
			<div className="space-y-2">
				<Label htmlFor={nameId}>Nome</Label>
				<Input
					id={nameId}
					autoComplete="name"
					maxLength={120}
					placeholder="Como podemos te chamar?"
					value={customer.name}
					onChange={(event) => setCustomer({ name: event.target.value })}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor={clubId}>Clube</Label>
				<Input
					id={clubId}
					maxLength={120}
					placeholder="Nome do seu clube"
					value={customer.club}
					onChange={(event) => setCustomer({ club: event.target.value })}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor={districtId}>Distrito</Label>
				<Input
					id={districtId}
					maxLength={60}
					placeholder="Ex.: 4590"
					value={customer.district}
					onChange={(event) => setCustomer({ district: event.target.value })}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor={phoneId}>Celular (WhatsApp)</Label>
				<PhoneInput
					id={phoneId}
					ref={phoneInputRef}
					value={customer.phone}
					onValueChange={(phone) => setCustomer({ phone })}
					aria-invalid={phoneError ? true : undefined}
					aria-describedby={phoneError ? errorId : undefined}
				/>
				{phoneError && (
					<p id={errorId} role="alert" className="text-sm font-bold text-destructive">
						{phoneError}
					</p>
				)}
			</div>
			<p className="text-[13px] text-muted-foreground">
				Não é obrigatório. Ajuda a loja a saber de quem é o pedido.
			</p>
		</div>
	);
}

/** Totals + the confirm button (children, e.g. Cart.Payment and Cart.Customer, go right above it). */
export function CartSummary({ children }: { children?: ReactNode }) {
	const { count, totalInCents } = useCart();
	const { checkout } = useCartPage();
	const { labels } = useSiteSettings();
	return (
		<aside
			aria-label="Resumo do pedido"
			className="space-y-5 rounded-2xl border-2 p-5 sm:p-6 lg:sticky lg:top-24"
		>
			<SectionLabel>Resumo</SectionLabel>
			<dl className="space-y-3 text-[15px]">
				<div className="flex items-center justify-between gap-3">
					<dt className="font-semibold text-muted-foreground">
						{count} {count === 1 ? "item" : "itens"}
					</dt>
					<dd>
						<Price cents={totalInCents} className="font-bold" />
					</dd>
				</div>
				<div className="flex items-center justify-between gap-3">
					<dt className="font-semibold text-muted-foreground">Entrega</dt>
					<dd className="text-right">
						{labels.shipping ? (
							<ShippingBadge />
						) : (
							<span className="font-semibold text-muted-foreground">A combinar</span>
						)}
					</dd>
				</div>
				<div className="flex items-baseline justify-between gap-3 border-t-2 pt-4">
					<dt className="text-sm font-extrabold tracking-[1px] text-label uppercase">Total</dt>
					<dd>
						<Price cents={totalInCents} className="font-display text-3xl font-semibold text-foreground" />
					</dd>
				</div>
			</dl>
			{children}
			<div className="space-y-3 pb-1">
				<Button block size="lg" onClick={checkout}>
					<MessageCircle /> Finalizar pelo WhatsApp
				</Button>
				<Button asChild block variant="secondary">
					<Link href="/">Continuar comprando</Link>
				</Button>
			</div>
			<p className="text-[13px] leading-relaxed text-muted-foreground">
				O WhatsApp abre com o pedido já escrito. É só enviar a mensagem para combinar pagamento e
				entrega com a loja.
			</p>
		</aside>
	);
}

/** Shown right after checkout (the cart is already empty). */
export function CartPlaced() {
	const { placed } = useCartPage();
	if (!placed) return null;
	return (
		<div className="mx-auto max-w-xl space-y-6 rounded-2xl border-2 p-6 text-center sm:p-8">
			<span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
				<CircleCheck className="size-8" strokeWidth={2.5} />
			</span>
			<div className="space-y-3">
				<h1 className="font-display text-3xl font-semibold text-foreground">Pedido pronto!</h1>
				<p className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 font-extrabold tracking-[1px] text-primary">
					<span className="text-xs uppercase">Código</span>
					<span className="font-display text-xl tracking-[2px]">#{placed.code}</span>
				</p>
				<p className="text-[15px] text-muted-foreground">
					Abrimos o WhatsApp com o seu pedido. Toque em enviar para a loja receber e combinar o
					pagamento e a entrega com você. Se precisar falar sobre ele, informe o código.
				</p>
			</div>
			<ul className="divide-y-2 rounded-2xl border-2 text-left">
				{placed.items.map((item) => (
					<li key={`${item.productId}-${item.size ?? ""}`} className="flex items-start justify-between gap-3 p-3">
						<span className="min-w-0 text-sm font-semibold text-foreground">
							{item.quantity}x {item.name}
							{item.size && <span className="text-muted-foreground"> · Tamanho {item.size}</span>}
						</span>
						<Price cents={item.priceInCents * item.quantity} className="shrink-0 text-sm font-bold" />
					</li>
				))}
				<li className="flex items-baseline justify-between gap-3 p-3">
					<span className="text-sm font-semibold text-muted-foreground">Pagamento</span>
					<span className="text-sm font-bold text-foreground">{PAYMENT_METHOD_LABELS[placed.paymentMethod]}</span>
				</li>
				<li className="flex items-baseline justify-between gap-3 p-3">
					<span className="text-sm font-extrabold tracking-[1px] text-label uppercase">Total</span>
					<Price cents={placed.totalInCents} className="font-display text-2xl font-semibold" />
				</li>
			</ul>
			<div className="flex flex-col gap-3 pb-1 sm:flex-row sm:justify-center">
				<Button asChild variant="secondary">
					<a href={placed.whatsappUrl} target="_blank" rel="noopener noreferrer">
						<MessageCircle /> Abrir o WhatsApp de novo
					</a>
				</Button>
				<Button asChild>
					<Link href="/">Voltar para a loja</Link>
				</Button>
			</div>
		</div>
	);
}

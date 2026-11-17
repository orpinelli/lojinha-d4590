"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
	createContext,
	Suspense,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
	type ComponentProps,
	type ReactNode,
	type RefObject,
} from "react";
import {
	ArrowLeft,
	ArrowRight,
	Check,
	CircleCheck,
	CreditCard,
	MessageCircle,
	QrCode,
	ShoppingCart,
	Trash2,
	WalletCards,
	type LucideIcon,
} from "lucide-react";
import { Price } from "@/components/store/price";
import { PRODUCT_PHOTO_FRAME, ProductPhoto } from "@/components/store/product-photo";
import { QuantityStepper } from "@/components/store/quantity-stepper";
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
import { formatWhatsapp, isValidWhatsapp, normalizeWhatsapp, onlyDigits } from "@/modules/shared/domain/phone";
import {
	CART_STEP_PARAM,
	CART_STEPS,
	cartStepIndex,
	cartStepSearch,
	parseCartStep,
	type CartStepId,
} from "./steps";

/*
 * Cart page parts. Each state part (Loading, Empty, Review, Placed) renders
 * only in its own state, so a page composes all of them and the right one shows.
 * The review is a checkout in steps (see ./steps.ts): products, details, payment.
 */

/** The customer details are remembered in this browser for the next order. */
const CUSTOMER_KEY = "rotaract-customer";

const EMPTY_CUSTOMER: CheckoutCustomer = { name: "", club: "", district: "", phone: "" };

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, LucideIcon> = {
	pix: QrCode,
	credit_card: CreditCard,
	debit_card: WalletCards,
};

/** What takes the focus when a step shows up. */
type StepFocus = "heading" | "phone";

type CartPageContextValue = {
	placed: PlacedOrder | null;
	/** Furthest step the visitor reached (index): the progress bar lets them go back to it. */
	reachedIndex: number;
	goToStep: (step: CartStepId, focus?: StepFocus) => void;
	/** Each step is a form (id below): submitting goes to the next step, or finishes on the last one. */
	continueFrom: (step: CartStepId) => void;
	stepFormId: string;
	/** Called once a new step is on screen: moves the focus there. */
	stepShown: () => void;
	stepHeadingRef: RefObject<HTMLHeadingElement | null>;
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

/** Step in the address bar, read in event handlers (outside of rendering). */
function stepFromLocation(): CartStepId {
	return parseCartStep(new URLSearchParams(window.location.search).get(CART_STEP_PARAM));
}

function stepUrl(step: CartStepId): string {
	return `${window.location.pathname}${cartStepSearch(step, window.location.search)}`;
}

/** Focuses a field and centers it on screen, so the sticky header can't cover it. */
function focusField(element: HTMLElement | null | undefined) {
	if (!element) return;
	element.focus({ preventScroll: true });
	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	element.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
}

const CartPageContext = createContext<CartPageContextValue | null>(null);

function useCartPage() {
	const context = useContext(CartPageContext);
	if (!context) throw new Error("Use as partes do Cart dentro de <Cart.Root>");
	return context;
}

/** Current step, from the address. Only inside Cart.Review (it provides the Suspense boundary). */
function useCartStep(): CartStepId {
	return parseCartStep(useSearchParams().get(CART_STEP_PARAM));
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
	const [reachedIndex, setReachedIndex] = useState(0);
	const stepFormId = useId();
	const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);
	const pendingFocus = useRef<StepFocus>("heading");
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

	/** Each step is a history entry: the back button returns to the previous one. */
	const goToStep = (step: CartStepId, focus: StepFocus = "heading") => {
		const current = stepFromLocation();
		setReachedIndex((reached) => Math.max(reached, cartStepIndex(current), cartStepIndex(step)));
		if (step === current) return;
		pendingFocus.current = focus;
		// Next.js keeps useSearchParams in sync with the native History API (no reload).
		window.history.pushState(null, "", stepUrl(step));
	};

	const stepShown = () => {
		const focus = pendingFocus.current;
		pendingFocus.current = "heading";
		if (focus === "phone" && phoneInputRef.current) {
			focusField(phoneInputRef.current);
			return;
		}
		// Screen readers announce the new step; on the phone it starts from the top.
		stepHeadingRef.current?.focus({ preventScroll: true });
		window.scrollTo({ top: 0 });
	};

	const setPaymentMethod = (method: PaymentMethod) => {
		setPaymentMethodState(method);
		setPaymentError(null);
	};

	const setCustomer = (changes: Partial<CheckoutCustomer>) => {
		setCustomerState((current) => ({ ...current, ...changes }));
		if (changes.phone !== undefined) setPhoneError(null);
	};

	/**
	 * The phone is optional, but when filled it must be a real number. Checked when
	 * leaving its step: validating on blur would show the message right as the
	 * button is pressed, pushing it down so the click misses.
	 */
	const validatePhone = () => {
		const phone = normalizeWhatsapp(customer.phone);
		const valid = phone === "" || isValidWhatsapp(phone);
		setPhoneError(valid ? null : PHONE_ERROR);
		return valid;
	};

	const checkout = () => {
		if (!paymentMethod) {
			setPaymentError(PAYMENT_ERROR);
			focusField(paymentGroupRef.current?.querySelector<HTMLInputElement>("input"));
			return;
		}
		// Already checked on its own step; the address could skip it.
		if (!validatePhone()) {
			goToStep("dados", "phone");
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
			// The order is done: a reload shows the (now empty) cart, not the payment step.
			window.history.replaceState(null, "", stepUrl(CART_STEPS[0].id));
			window.scrollTo({ top: 0 });
		}
	};

	const continueFrom = (step: CartStepId) => {
		if (step === "dados" && !validatePhone()) {
			focusField(phoneInputRef.current);
			return;
		}
		const next = CART_STEPS[cartStepIndex(step) + 1];
		if (next) goToStep(next.id);
		else checkout();
	};

	return (
		<CartPageContext.Provider
			value={{
				placed,
				reachedIndex,
				goToStep,
				continueFrom,
				stepFormId,
				stepShown,
				stepHeadingRef,
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

function CartSkeleton() {
	return (
		<div aria-busy="true" aria-label="Carregando o carrinho" className="space-y-3">
			{[0, 1].map((key) => (
				<div key={key} className="h-28 animate-pulse rounded-2xl bg-muted" />
			))}
		</div>
	);
}

export function CartLoading() {
	if (useCartState() !== "loading") return null;
	return <CartSkeleton />;
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

/** Two columns on desktop: the steps on the left, the sticky summary on the right. */
export function CartReview({ className, children, ...props }: ComponentProps<"div">) {
	if (useCartState() !== "review") return null;
	return (
		<div
			className={cn(
				"grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10",
				className,
			)}
			{...props}
		>
			{/* The step comes from the address (useSearchParams), which needs a Suspense boundary. */}
			<Suspense fallback={<CartSkeleton />}>{children}</Suspense>
		</div>
	);
}

/** Left column: the progress bar and the current step. Moves the focus to each new step. */
export function CartSteps({ className, ...props }: ComponentProps<"div">) {
	const step = useCartStep();
	const { stepShown } = useCartPage();
	const shownStep = useRef(step);
	useEffect(() => {
		if (shownStep.current === step) return;
		shownStep.current = step;
		stepShown();
	}, [step, stepShown]);
	return <div className={cn("min-w-0 space-y-5", className)} {...props} />;
}

/** "1 Produtos — 2 Seus dados — 3 Pagamento"; steps already reached can be clicked to go back. */
export function CartStepper() {
	const step = useCartStep();
	const { reachedIndex, goToStep } = useCartPage();
	const currentIndex = cartStepIndex(step);
	const lastReached = Math.max(reachedIndex, currentIndex);
	return (
		<nav aria-label="Etapas do pedido">
			<ol className="grid grid-cols-3">
				{CART_STEPS.map((item, index) => {
					const current = index === currentIndex;
					const done = index < currentIndex;
					const reached = index <= lastReached;
					const clickable = reached && !current;
					const content = (
						<>
							<span
								aria-hidden
								className={cn(
									"relative z-10 flex size-9 items-center justify-center rounded-full border-2 text-sm font-extrabold transition-colors",
									current
										? "border-primary bg-primary text-primary-foreground"
										: reached
											? "border-primary bg-background text-primary"
											: "border-border bg-background text-muted-foreground",
								)}
							>
								{done ? <Check className="size-4" strokeWidth={3.5} /> : index + 1}
							</span>
							<span
								className={cn(
									"text-[13px] leading-tight font-bold",
									current ? "text-foreground" : "text-muted-foreground",
									clickable && "underline-offset-4 group-hover:text-primary group-hover:underline",
								)}
							>
								{item.label}
							</span>
							{done && <span className="sr-only">, concluída</span>}
						</>
					);
					return (
						<li key={item.id} className="relative flex justify-center">
							{index > 0 && (
								<span
									aria-hidden
									className={cn(
										"absolute top-[17px] right-1/2 h-0.5 w-full",
										reached ? "bg-primary" : "bg-border",
									)}
								/>
							)}
							{clickable ? (
								<button
									type="button"
									onClick={() => goToStep(item.id)}
									className="group flex flex-col items-center gap-1.5 rounded-xl px-2 pb-1 text-center outline-none focus-visible:ring-[3px] focus-visible:ring-link/40"
								>
									{content}
								</button>
							) : (
								<span
									aria-current={current ? "step" : undefined}
									className="flex flex-col items-center gap-1.5 px-2 pb-1 text-center"
								>
									{content}
								</span>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}

/**
 * One step of the checkout, shown only while it is the current one. Its content
 * is a form, so Enter in a field (or "Ir" on the phone keyboard) continues; the
 * summary's main button submits it.
 */
export function CartStep({ step, children }: { step: CartStepId; children: ReactNode }) {
	const current = useCartStep();
	const { stepHeadingRef, stepFormId, continueFrom } = useCartPage();
	const headingId = useId();
	if (current !== step) return null;
	const index = cartStepIndex(step);
	const { title, description, optional } = CART_STEPS[index];
	return (
		<section aria-labelledby={headingId} className="rounded-2xl border-2 p-4 sm:p-6">
			<header className="mb-5 space-y-1">
				<p className="text-xs font-extrabold tracking-[1px] text-label uppercase">
					Etapa {index + 1} de {CART_STEPS.length}
				</p>
				<h2
					id={headingId}
					ref={stepHeadingRef}
					tabIndex={-1}
					className="font-display text-2xl leading-tight font-semibold text-foreground outline-none"
				>
					{title}
					{optional && <span className="ml-2 text-sm font-semibold text-muted-foreground">(opcional)</span>}
				</h2>
				<p className="text-sm text-muted-foreground">{description}</p>
			</header>
			<form
				id={stepFormId}
				noValidate
				onSubmit={(event) => {
					event.preventDefault();
					continueFrom(step);
				}}
			>
				{children}
			</form>
		</section>
	);
}

function CartLine({ item }: { item: CartItem }) {
	const { updateQuantity, removeItem } = useCart();
	const href = productPath({ id: item.productId });
	return (
		<li className="flex gap-3 py-4 first:pt-0 last:pb-0 sm:gap-4">
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
		<ul aria-label="Itens do carrinho" className="divide-y-2">
			{items.map((item) => (
				<CartLine key={`${item.productId}-${item.size ?? ""}`} item={item} />
			))}
		</ul>
	);
}

/** Optional fields: name, club, district and phone only feed the store's order history. */
export function CartCustomer() {
	const { customer, setCustomer, phoneError, phoneInputRef } = useCartPage();
	const nameId = useId();
	const clubId = useId();
	const districtId = useId();
	const phoneId = useId();
	const errorId = useId();
	return (
		<div className="grid gap-4 sm:max-w-md">
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
		</div>
	);
}

/** Required choice: Pix, credit card or debit card. */
export function CartPayment() {
	const { paymentMethod, setPaymentMethod, paymentError, paymentGroupRef } = useCartPage();
	const errorId = useId();
	const name = useId();
	return (
		<div>
			<div
				ref={paymentGroupRef}
				role="radiogroup"
				aria-label="Forma de pagamento"
				aria-required
				aria-invalid={paymentError ? true : undefined}
				aria-describedby={paymentError ? errorId : undefined}
				className="grid gap-2 sm:grid-cols-3"
			>
				{PAYMENT_METHODS.map((method) => {
					const Icon = PAYMENT_METHOD_ICONS[method];
					return (
						<RadioCard
							key={method}
							name={name}
							value={method}
							checked={paymentMethod === method}
							onChange={() => setPaymentMethod(method)}
							className={cn("items-center py-3", paymentError && "border-destructive/60")}
						>
							<span className="flex items-center gap-2 text-sm font-extrabold text-foreground">
								<Icon className="size-5 shrink-0 text-primary" strokeWidth={2.25} aria-hidden />
								{PAYMENT_METHOD_LABELS[method]}
							</span>
						</RadioCard>
					);
				})}
			</div>
			{paymentError && (
				<p id={errorId} role="alert" className="mt-3 text-sm font-bold text-destructive">
					{paymentError}
				</p>
			)}
		</div>
	);
}

/** "Maria · Rotaract Club Centro · Distrito 4590 · +55 19 …" (only what was filled). */
function customerSummary({ name, club, district, phone }: CheckoutCustomer): string {
	return [name.trim(), club.trim(), district.trim() && `Distrito ${district.trim()}`, phone && formatWhatsapp(phone)]
		.filter(Boolean)
		.join(" · ");
}

/**
 * Sticky summary, on every step: totals, the chosen payment and the step's
 * buttons. "Finalizar pelo WhatsApp" only shows on the last step.
 */
export function CartSummary({ children }: { children?: ReactNode }) {
	const step = useCartStep();
	const { items, count, totalInCents } = useCart();
	const { paymentMethod, customer, stepFormId, goToStep } = useCartPage();
	const { labels } = useSiteSettings();
	const index = cartStepIndex(step);
	const previous = CART_STEPS[index - 1];
	const { next } = CART_STEPS[index];
	return (
		<aside
			aria-label="Resumo do pedido"
			className="space-y-5 rounded-2xl border-2 p-5 sm:p-6 lg:sticky lg:top-24"
		>
			<SectionLabel>Resumo</SectionLabel>
			<dl className="space-y-3 text-[15px]">
				<div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
					<dt className="font-semibold text-muted-foreground">
						{count} {count === 1 ? "item" : "itens"}
					</dt>
					<dd>
						<Price cents={totalInCents} className="font-bold" />
					</dd>
					{/* Past the products step the list is out of sight: keep what is being ordered here. */}
					{previous && (
						<dd className="col-span-2 line-clamp-2 text-sm text-muted-foreground">
							{items
								.map((item) => `${item.quantity}x ${item.name}${item.size ? ` (${item.size})` : ""}`)
								.join(", ")}
						</dd>
					)}
				</div>
				{/* Last step: everything that goes in the order, for a final check. */}
				{!next && (
					<div className="space-y-0.5">
						<dt className="font-semibold text-muted-foreground">Seus dados</dt>
						<dd className="text-sm font-semibold break-words text-foreground">
							{customerSummary(customer) || "Não informados"}
						</dd>
					</div>
				)}
				{/* The admin text is a full sentence ("Entrega em eventos ou a combinar"): plain, one line. */}
				<div className="flex items-center justify-between gap-3">
					<dt className={cn("font-semibold text-muted-foreground", labels.shipping && "sr-only")}>Entrega</dt>
					<dd className="font-semibold text-muted-foreground">{labels.shipping || "A combinar"}</dd>
				</div>
				<div className="flex items-center justify-between gap-3">
					<dt className="font-semibold text-muted-foreground">Pagamento</dt>
					<dd className={cn("text-right font-semibold", paymentMethod ? "text-foreground" : "text-muted-foreground")}>
						{paymentMethod ? PAYMENT_METHOD_LABELS[paymentMethod] : "A escolher"}
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
				{/* Submits the step's form: the step validates its fields before going on. */}
				<Button block size="lg" type="submit" form={stepFormId}>
					{next ? (
						<>
							{next} <ArrowRight />
						</>
					) : (
						<>
							<MessageCircle /> Finalizar pelo WhatsApp
						</>
					)}
				</Button>
				{previous ? (
					<Button block variant="secondary" onClick={() => goToStep(previous.id)}>
						<ArrowLeft /> Voltar para {previous.label.toLowerCase()}
					</Button>
				) : (
					<Button asChild block variant="secondary">
						<Link href="/">Continuar comprando</Link>
					</Button>
				)}
			</div>
			{!next && (
				<p className="text-[13px] leading-relaxed text-muted-foreground">
					O WhatsApp abre com o pedido já escrito. É só enviar a mensagem para a loja receber.
				</p>
			)}
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

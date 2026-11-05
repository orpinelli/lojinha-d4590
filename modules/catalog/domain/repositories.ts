import type {
	Category,
	CategoryInput,
	Product,
	ProductInput,
} from "./catalog-schemas";

export type ProductFilter = { onlyActive?: boolean };

/** Port: any storage (local files, Supabase...) implements these contracts. */
export interface ProductRepository {
	/** Sorted by `position`, then `name`. */
	list(filter?: ProductFilter): Promise<Product[]>;
	findById(id: string): Promise<Product | null>;
	create(input: ProductInput, position: number): Promise<Product>;
	/** Keeps the current position. */
	update(id: string, input: ProductInput): Promise<Product | null>;
	delete(id: string): Promise<boolean>;
	countByCategory(): Promise<Record<string, number>>;
}

export interface CategoryRepository {
	/** Sorted by `position`, then `name`. */
	list(): Promise<Category[]>;
	findById(id: string): Promise<Category | null>;
	create(input: CategoryInput, position: number): Promise<Category>;
	update(id: string, input: CategoryInput): Promise<Category | null>;
	delete(id: string): Promise<boolean>;
	/** Persists the given order (`ids[0]` becomes position 0). */
	reorder(ids: string[]): Promise<void>;
}

export type CatalogRepositories = {
	products: ProductRepository;
	categories: CategoryRepository;
};

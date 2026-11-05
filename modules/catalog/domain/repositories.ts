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
	create(input: ProductInput): Promise<Product>;
	update(id: string, input: ProductInput): Promise<Product | null>;
	delete(id: string): Promise<boolean>;
	countByCategory(): Promise<Record<string, number>>;
}

export interface CategoryRepository {
	/** Sorted by `position`, then `name`. */
	list(): Promise<Category[]>;
	findById(id: string): Promise<Category | null>;
	create(input: CategoryInput): Promise<Category>;
	update(id: string, input: CategoryInput): Promise<Category | null>;
	delete(id: string): Promise<boolean>;
}

export type CatalogRepositories = {
	products: ProductRepository;
	categories: CategoryRepository;
};

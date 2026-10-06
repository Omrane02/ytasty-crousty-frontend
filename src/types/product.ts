export const PRODUCT_CATEGORIES = [
  { value: "burgers", label: "Burgers" },
  { value: "menus", label: "Menus" },
  { value: "accompagnements", label: "Accompagnements" },
  { value: "boissons", label: "Boissons" },
  { value: "desserts", label: "Desserts" },
] as const;

export function categoryLabel(value: string): string {
  return PRODUCT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export interface Product {
  id: number;
  name: string;
  image: string;
  description: string;
  category: string;
  price: number;
  is_available: boolean;
  ingredients: string[];
  restaurant_id: number;
}

export interface ProductCreate {
  name: string;
  image: string;
  description: string;
  category: string;
  price: number;
  is_available: boolean;
  restaurant_id: number;
  ingredients: string[];
}


export type ProductUpdate = Partial<Omit<ProductCreate, "is_available">>;
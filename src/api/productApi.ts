import axiosInstance from "./axiosInstance";
import type { Product, ProductCreate, ProductUpdate } from "../types/product";

export interface ProductFilters {
  restaurant_id?: number;
  category?: string;
  q?: string;
  is_available?: boolean;
}


export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const { data } = await axiosInstance.get<Product[]>("/products", { params: filters });
  return data;
}

export async function getProductById(id: number): Promise<Product> {
  const { data } = await axiosInstance.get<Product>(`/products/${id}`);
  return data;
}

export async function createProduct(payload: ProductCreate): Promise<Product> {
  const { data } = await axiosInstance.post<Product>("/products", payload);
  return data;
}

export async function updateProduct(id: number, payload: ProductUpdate): Promise<Product> {
  const { data } = await axiosInstance.patch<Product>(`/products/${id}`, payload);
  return data;
}

export async function updateProductAvailability(id: number, isAvailable: boolean): Promise<Product> {
  const { data } = await axiosInstance.patch<Product>(`/products/${id}/availability`, {
    is_available: isAvailable,
  });
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  await axiosInstance.delete(`/products/${id}`);
}
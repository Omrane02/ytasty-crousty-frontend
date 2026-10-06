import axiosInstance from "./axiosInstance";
import type { Order, OrderStatus, ProgressStatus } from "../types/order";

export async function getRestaurantOrders(restaurantId: number, status?: OrderStatus): Promise<Order[]> {
  const { data } = await axiosInstance.get<Order[]>(`/restaurants/${restaurantId}/orders`, {
    params: { status },
  });
  return data;
}

export async function updateOrderStatus(orderNumber: number, status: ProgressStatus): Promise<void> {
  await axiosInstance.patch(`/orders/${orderNumber}/status`, { status });
}

export async function cancelOrder(orderNumber: number): Promise<void> {
  await axiosInstance.post(`/orders/${orderNumber}/cancel`);
}
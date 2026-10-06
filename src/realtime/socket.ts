import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "../api/axiosInstance";
import type { OrderStatus } from "../types/order";

export interface OrderEvent {
  order_number: number;
  restaurant_id: number;
  status: OrderStatus;
}

// "websocket" seul : pas de polling HTTP, donc pas d'interstitiel ngrok ni de souci de CORS.
export const socket: Socket = io(API_BASE_URL, {
  autoConnect: false,
  transports: ["websocket"],
});
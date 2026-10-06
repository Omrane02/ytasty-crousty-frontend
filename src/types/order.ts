export const ORDER_STATUSES = ["pending", "validated", "preparing", "ready", "collected", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Statuts qu'on peut envoyer à PATCH /orders/{n}/status (l'annulation a sa propre route).
export type ProgressStatus = Exclude<OrderStatus, "cancelled">;

export type PickupMode = "onsite" | "takeaway";

export interface OrderItem {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
}

export interface Order {
  order_number: number;
  restaurant_id: number;
  created_at: string;
  items: OrderItem[];
  total_price: number;
  status: OrderStatus;
  pickup_mode: PickupMode;
  customer: CustomerInfo;
}

// Colonnes du tableau cuisine : les commandes "collected" et "cancelled" sortent de l'écran.
export const BOARD_STATUSES = ["pending", "validated", "preparing", "ready"] as const;
export type BoardStatus = (typeof BOARD_STATUSES)[number];

export function isBoardStatus(status: OrderStatus): status is BoardStatus {
  return (BOARD_STATUSES as readonly OrderStatus[]).includes(status);
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  validated: "Validée",
  preparing: "En préparation",
  ready: "Prête",
  collected: "Récupérée",
  cancelled: "Annulée",
};

// Étape suivante d'une commande dans le flux de la cuisine.
export const NEXT_STATUS: Partial<Record<OrderStatus, ProgressStatus>> = {
  pending: "validated",
  validated: "preparing",
  preparing: "ready",
  ready: "collected",
};

export const ADVANCE_LABELS: Record<BoardStatus, string> = {
  pending: "Valider",
  validated: "Lancer la préparation",
  preparing: "Marquer prête",
  ready: "Remise au client",
};

export const PICKUP_LABELS: Record<PickupMode, string> = {
  onsite: "Sur place",
  takeaway: "À emporter",
};
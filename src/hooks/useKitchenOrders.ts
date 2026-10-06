import { useCallback, useEffect, useRef, useState } from "react";
import { getRestaurantOrders } from "../api/orderApi";
import type { Order } from "../types/order";
import { getErrorMessage } from "../utils/errors";

type LoadStatus = "loading" | "succeeded" | "failed";

// Charge les commandes d'un restaurant. `refresh(true)` recharge en silence (sans skeleton) :
// c'est ce que l'option A (Socket.io) appellera à chaque nouvelle commande.
export function useKitchenOrders(restaurantId: number | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const lastRequest = useRef(0);

  const refresh = useCallback(
    async (silent = false): Promise<void> => {
      if (restaurantId === null) return;
      lastRequest.current += 1;
      const requestId = lastRequest.current;
      if (!silent) setStatus("loading");

      try {
        const data = await getRestaurantOrders(restaurantId);
        if (requestId !== lastRequest.current) return; // réponse périmée
        setOrders(data);
        setError(null);
        setStatus("succeeded");
      } catch (e) {
        if (requestId !== lastRequest.current) return;
        setError(getErrorMessage(e));
        if (!silent) setStatus("failed"); // un échec silencieux garde l'affichage actuel
      }
    },
    [restaurantId],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { orders, status, error, refresh };
}
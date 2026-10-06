import { useEffect, useRef, useState } from "react";
import { socket, type OrderEvent } from "../realtime/socket";

interface KitchenSocketHandlers {
  onNewOrder: (event: OrderEvent) => void;
  onOrderUpdated: (event: OrderEvent) => void;
}

// Rejoint la salle du restaurant et appelle les handlers à chaque événement. Retourne l'état de la connexion.
export function useKitchenSocket(restaurantId: number | null, handlers: KitchenSocketHandlers): boolean {
  const [connected, setConnected] = useState(false);

  // Les handlers changent à chaque rendu : on garde la dernière version dans une ref.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (restaurantId === null) return;

    const join = () => {
      socket.emit("join_restaurant", { restaurant_id: restaurantId });
    };
    const handleConnect = () => {
      setConnected(true);
      join(); // aussi appelé après une reconnexion automatique
    };
    const handleDisconnect = () => setConnected(false);
    const handleNew = (event: OrderEvent) => handlersRef.current.onNewOrder(event);
    const handleUpdated = (event: OrderEvent) => handlersRef.current.onOrderUpdated(event);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("order:new", handleNew);
    socket.on("order:updated", handleUpdated);

    if (socket.connected) handleConnect();
    else socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("order:new", handleNew);
      socket.off("order:updated", handleUpdated);
      socket.disconnect();
      setConnected(false);
    };
  }, [restaurantId]);

  return connected;
}
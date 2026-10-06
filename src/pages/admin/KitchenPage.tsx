import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { Link as RouterLink } from "react-router-dom";
import { cancelOrder, updateOrderStatus } from "../../api/orderApi";
import { getProducts } from "../../api/productApi";
import { useAppSelector } from "../../app/hooks";
import { useNotify } from "../../components/common/NotificationContext";
import { OrderCard } from "../../components/orders/OrderCard";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { selectRestaurants } from "../../features/restaurant/restaurantSlice";
import { useKitchenOrders } from "../../hooks/useKitchenOrders";
import { useKitchenSocket } from "../../hooks/useKitchenSocket";
import { useNow } from "../../hooks/useNow";
import type { OrderEvent } from "../../realtime/socket";
import {
  BOARD_STATUSES,
  NEXT_STATUS,
  STATUS_LABELS,
  isBoardStatus,
  type BoardStatus,
  type Order,
} from "../../types/order";
import { getErrorMessage } from "../../utils/errors";
import { ageInMinutes, getUrgency, parseApiDate } from "../../utils/orderTiming";
import { enableSound, playNewOrderSound } from "../../utils/sound";

const POLL_FAST_MS = 15000; // sans socket : rechargement toutes les 15 s
const POLL_SLOW_MS = 60000; // avec socket : simple filet de sécurité
const HIGHLIGHT_MS = 10000;

export function KitchenPage() {
  const notify = useNotify();
  const user = useAppSelector(selectCurrentUser);
  const restaurants = useAppSelector(selectRestaurants);
  const selectedId = useAppSelector((state) => state.restaurant.selectedId);

  // Le staff est verrouillé sur son restaurant ; l'admin peut changer d'établissement.
  const isAdmin = user?.role === "admin";
  const [adminChoice, setAdminChoice] = useState<number | null>(null);
  const restaurantId: number | null = isAdmin
    ? (adminChoice ?? selectedId ?? restaurants[0]?.id ?? null)
    : (user?.restaurant_id ?? null);
  const restaurantName = restaurants.find((r) => r.id === restaurantId)?.name;

  const { orders, status, error, refresh } = useKitchenOrders(restaurantId);
  const now = useNow();

  const [filter, setFilter] = useState<"all" | BoardStatus>("all");
  const [productNames, setProductNames] = useState<ReadonlyMap<number, string>>(new Map());
  const [busyNumbers, setBusyNumbers] = useState<ReadonlySet<number>>(new Set());
  const [toCancel, setToCancel] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [highlighted, setHighlighted] = useState<ReadonlySet<number>>(new Set());

  // Option A : nouvelle commande reçue en direct (alerte visuelle + sonore).
  const handleNewOrder = (event: OrderEvent) => {
    void refresh(true);
    notify(`Nouvelle commande n°${event.order_number} !`, "info");
    if (soundOn) playNewOrderSound();
    setHighlighted((prev) => new Set(prev).add(event.order_number));
    window.setTimeout(() => {
      setHighlighted((prev) => {
        const next = new Set(prev);
        next.delete(event.order_number);
        return next;
      });
    }, HIGHLIGHT_MS);
  };

  const connected = useKitchenSocket(restaurantId, {
    onNewOrder: handleNewOrder,
    onOrderUpdated: () => {
      void refresh(true);
    },
  });

  // Les lignes de commande ne contiennent que product_id : on charge les noms du restaurant.
  useEffect(() => {
    if (restaurantId === null) return;
    let cancelled = false;
    getProducts({ restaurant_id: restaurantId })
      .then((products) => {
        if (cancelled) return;
        setProductNames(new Map(products.map((p): [number, string] => [p.id, p.name])));
      })
      .catch(() => {
        // Les noms sont un confort : sans eux on affiche "Produit #id".
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  // Rechargement régulier en silence : rapide sans socket, lent avec (filet de sécurité).
  useEffect(() => {
    if (restaurantId === null) return;
    const id = window.setInterval(
      () => {
        void refresh(true);
      },
      connected ? POLL_SLOW_MS : POLL_FAST_MS,
    );
    return () => window.clearInterval(id);
  }, [restaurantId, refresh, connected]);

  const boardOrders = useMemo(
    () =>
      orders
        .filter((o) => isBoardStatus(o.status))
        .sort((a, b) => parseApiDate(a.created_at) - parseApiDate(b.created_at)), // les plus anciennes d'abord
    [orders],
  );

  const lateCount = boardOrders.filter(
    (o) => getUrgency(o.status, ageInMinutes(o.created_at, now)) === "late",
  ).length;

  const columns = BOARD_STATUSES.filter((s) => filter === "all" || s === filter);

  const setBusy = (orderNumber: number, busy: boolean) => {
    setBusyNumbers((prev) => {
      const next = new Set(prev);
      if (busy) next.add(orderNumber);
      else next.delete(orderNumber);
      return next;
    });
  };

  const handleAdvance = async (order: Order): Promise<void> => {
    const next = NEXT_STATUS[order.status];
    if (next === undefined) return;
    setBusy(order.order_number, true);
    try {
      await updateOrderStatus(order.order_number, next);
      notify(`Commande n°${order.order_number} : ${STATUS_LABELS[next].toLowerCase()}.`, "success");
      await refresh(true);
    } catch (e) {
      notify(getErrorMessage(e), "error");
    } finally {
      setBusy(order.order_number, false);
    }
  };

  const handleCancel = async (): Promise<void> => {
    if (toCancel === null) return;
    setCancelling(true);
    try {
      await cancelOrder(toCancel.order_number);
      notify(`Commande n°${toCancel.order_number} annulée.`, "success");
      setToCancel(null);
      await refresh(true);
    } catch (e) {
      notify(getErrorMessage(e), "error");
    } finally {
      setCancelling(false);
    }
  };

  const toggleSound = () => {
    if (soundOn) {
      setSoundOn(false);
    } else if (enableSound()) {
      setSoundOn(true);
      playNewOrderSound(); // bip de confirmation
    }
  };

  return (
    <Box sx={{ py: { xs: 2, md: 4 } }}>
      <Button component={RouterLink} to="/admin" sx={{ mb: 2 }}>
        ← Retour au back-office
      </Button>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h4" component="h1">
            Cuisine{restaurantName !== undefined ? ` — ${restaurantName}` : ""}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {connected ? "Mise à jour en direct." : "Reconnexion en cours : actualisation toutes les 15 secondes."}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isAdmin && (
            <TextField
              select
              size="small"
              label="Restaurant"
              value={restaurantId ?? ""}
              onChange={(e) => setAdminChoice(Number(e.target.value))}
              sx={{ minWidth: 200 }}
            >
              {restaurants.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </TextField>
          )}

          <Chip
            size="small"
            color={connected ? "success" : "default"}
            variant={connected ? "filled" : "outlined"}
            label={connected ? "Live" : "Hors ligne"}
          />

          <Tooltip title={soundOn ? "Couper le son" : "Activer le son des nouvelles commandes"}>
            <IconButton onClick={toggleSound} aria-label={soundOn ? "Couper le son" : "Activer le son"}>
              {soundOn ? <VolumeUpIcon /> : <VolumeOffIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Actualiser">
            <IconButton
              onClick={() => {
                void refresh(true);
              }}
              aria-label="Actualiser les commandes"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {restaurantId === null ? (
        <Alert severity="warning" sx={{ mt: 3 }}>
          Votre compte n'est rattaché à aucun restaurant : impossible d'afficher les commandes.
        </Alert>
      ) : (
        <>
          {lateCount > 0 && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {lateCount} commande{lateCount > 1 ? "s attendent" : " attend"} depuis trop longtemps.
            </Alert>
          )}

          {status === "failed" && (
            <Alert
              severity="error"
              sx={{ mt: 3 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    void refresh();
                  }}
                >
                  Réessayer
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 3, mb: 2 }}>
            <Chip
              label={`Toutes (${boardOrders.length})`}
              color={filter === "all" ? "primary" : "default"}
              onClick={() => setFilter("all")}
            />
            {BOARD_STATUSES.map((s) => (
              <Chip
                key={s}
                label={`${STATUS_LABELS[s]} (${boardOrders.filter((o) => o.status === s).length})`}
                color={filter === s ? "primary" : "default"}
                onClick={() => setFilter(s)}
              />
            ))}
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              alignItems: "start",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
                lg: `repeat(${columns.length}, minmax(0, 1fr))`,
              },
            }}
          >
            {columns.map((column) => {
              const columnOrders = boardOrders.filter((o) => o.status === column);
              return (
                <Box
                  key={column}
                  sx={{ bgcolor: "action.hover", borderRadius: 3, p: 1.5, display: "grid", gap: 1.5, alignContent: "start" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 0.5 }}>
                    <Typography variant="h6">{STATUS_LABELS[column]}</Typography>
                    <Chip size="small" label={columnOrders.length} />
                  </Box>

                  {status === "loading" ? (
                    <>
                      <Skeleton variant="rounded" height={170} />
                      <Skeleton variant="rounded" height={170} />
                    </>
                  ) : columnOrders.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                      Aucune commande
                    </Typography>
                  ) : (
                    columnOrders.map((order) => (
                      <OrderCard
                        key={order.order_number}
                        order={order}
                        productNames={productNames}
                        now={now}
                        busy={busyNumbers.has(order.order_number)}
                        isNew={highlighted.has(order.order_number)}
                        onAdvance={(o) => {
                          void handleAdvance(o);
                        }}
                        onCancel={setToCancel}
                      />
                    ))
                  )}
                </Box>
              );
            })}
          </Box>
        </>
      )}

      <Dialog open={toCancel !== null} onClose={cancelling ? undefined : () => setToCancel(null)}>
        <DialogTitle>Annuler cette commande ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            La commande n°{toCancel?.order_number} de {toCancel?.customer.name} sera annulée. Cette action est
            définitive.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToCancel(null)} disabled={cancelling}>
            Retour
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={cancelling}
            onClick={() => {
              void handleCancel();
            }}
          >
            Annuler la commande
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
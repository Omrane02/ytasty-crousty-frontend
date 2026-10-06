import { Box, Button, Card, CardContent, Chip, Divider, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { ADVANCE_LABELS, NEXT_STATUS, PICKUP_LABELS, isBoardStatus, type Order } from "../../types/order";
import { formatPrice } from "../../utils/format";
import { ageInMinutes, formatAge, getUrgency } from "../../utils/orderTiming";

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(215, 48, 31, 0.35); }
  50% { box-shadow: 0 0 0 8px rgba(215, 48, 31, 0); }
`;

interface OrderCardProps {
  order: Order;
  productNames: ReadonlyMap<number, string>;
  now: number;
  busy: boolean;
  isNew: boolean; // commande arrivée à l'instant (reçue par Socket.io) : on la surligne
  onAdvance: (order: Order) => void;
  onCancel: (order: Order) => void;
}

export function OrderCard({ order, productNames, now, busy, isNew, onAdvance, onCancel }: OrderCardProps) {
  const minutes = ageInMinutes(order.created_at, now);
  const urgency = getUrgency(order.status, minutes);
  const advanceLabel = isBoardStatus(order.status) ? ADVANCE_LABELS[order.status] : null;
  const canAdvance = advanceLabel !== null && NEXT_STATUS[order.status] !== undefined;

  return (
    <Card
      sx={{
        borderLeft: 6,
        borderLeftColor: urgency === "late" ? "error.main" : urgency === "warning" ? "warning.main" : "divider",
        ...(urgency === "late" && { animation: `${pulse} 1.8s ease-in-out infinite` }),
        ...(isNew && { outline: "3px solid", outlineColor: "primary.main" }),
      }}
    >
      <CardContent sx={{ display: "grid", gap: 1.25 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography variant="h5" component="p" sx={{ fontWeight: 800 }}>
            #{order.order_number}
          </Typography>
          <Chip
            size="small"
            icon={order.pickup_mode === "onsite" ? <RestaurantIcon /> : <ShoppingBagIcon />}
            label={PICKUP_LABELS[order.pickup_mode]}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Chip
            size="small"
            variant={urgency === "ok" ? "outlined" : "filled"}
            color={urgency === "late" ? "error" : urgency === "warning" ? "warning" : "default"}
            icon={urgency === "ok" ? <ScheduleIcon /> : <WarningAmberIcon />}
            label={urgency === "late" ? `En retard · ${formatAge(minutes)}` : formatAge(minutes)}
          />
          {isNew && <Chip size="small" color="primary" label="Nouvelle" />}
          <Typography variant="body2" color="text.secondary">
            {order.customer.name}
          </Typography>
        </Box>

        <Divider />

        <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none", display: "grid", gap: 0.5 }}>
          {order.items.map((item, index) => (
            <Typography component="li" key={`${item.product_id}-${index}`} variant="body2">
              <strong>{item.quantity}×</strong> {productNames.get(item.product_id) ?? `Produit #${item.product_id}`}
            </Typography>
          ))}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
          Total : {formatPrice(order.total_price)}
        </Typography>

        <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
          {canAdvance && (
            <Button
              variant="contained"
              size="small"
              endIcon={<ArrowForwardIcon />}
              disabled={busy}
              onClick={() => onAdvance(order)}
              sx={{ flexGrow: 1 }}
            >
              {advanceLabel}
            </Button>
          )}
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<CloseIcon />}
            disabled={busy}
            onClick={() => onCancel(order)}
          >
            Annuler
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
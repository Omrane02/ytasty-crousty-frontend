import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
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
  Paper,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Link as RouterLink } from "react-router-dom";
import { deleteProduct, getProducts, updateProductAvailability } from "../../api/productApi";
import { useAppSelector } from "../../app/hooks";
import { useNotify } from "../../components/common/NotificationContext";
import { ProductFormDialog } from "../../components/product/ProductFormDialog";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { selectRestaurants } from "../../features/restaurant/restaurantSlice";
import { PRODUCT_CATEGORIES, categoryLabel, type Product } from "../../types/product";
import { getErrorMessage } from "../../utils/errors";
import { formatPrice } from "../../utils/format";

type LoadStatus = "loading" | "succeeded" | "failed";

export function ProductsAdminPage() {
  const notify = useNotify();
  const user = useAppSelector(selectCurrentUser);
  const restaurants = useAppSelector(selectRestaurants);

  const isAdmin = user?.role === "admin";
  // Le staff est limité à son restaurant ; l'admin choisit (ou voit tout).
  const [restaurantFilter, setRestaurantFilter] = useState<number | "all">("all");
  const scopeRestaurantId: number | undefined = isAdmin
    ? restaurantFilter === "all"
      ? undefined
      : restaurantFilter
    : (user?.restaurant_id ?? undefined);
  const canLoad = isAdmin || (user?.restaurant_id ?? null) !== null;

  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [pendingIds, setPendingIds] = useState<ReadonlySet<number>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!canLoad) return;
    let cancelled = false;
    setStatus("loading");
    getProducts({ restaurant_id: scopeRestaurantId })
      .then((data) => {
        if (cancelled) return;
        setProducts(data);
        setStatus("succeeded");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(getErrorMessage(e));
        setStatus("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [canLoad, scopeRestaurantId, reloadKey]);

  const restaurantName = (id: number): string => restaurants.find((r) => r.id === id)?.name ?? `Restaurant ${id}`;

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (categoryFilter === "all" || p.category === categoryFilter) &&
        (term === "" || p.name.toLowerCase().includes(term)),
    );
  }, [products, search, categoryFilter]);

  const handleToggle = async (product: Product, isAvailable: boolean): Promise<void> => {
    setPendingIds((prev) => new Set(prev).add(product.id));
    try {
      const updated = await updateProductAvailability(product.id, isAvailable);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      notify(`${updated.name} : ${updated.is_available ? "de nouveau disponible" : "en rupture"}.`, "success");
    } catch (e) {
      notify(getErrorMessage(e), "error");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (toDelete === null) return;
    setDeleting(true);
    try {
      await deleteProduct(toDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== toDelete.id));
      notify(`« ${toDelete.name} » supprimé.`, "success");
      setToDelete(null);
    } catch (e) {
      notify(getErrorMessage(e), "error");
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setFormOpen(true);
  };

  const columnCount = isAdmin ? 5 : 4;

  return (
    <Box sx={{ py: { xs: 2, md: 4 } }}>
      <Button component={RouterLink} to="/admin" sx={{ mb: 2 }}>
        ← Retour au back-office
      </Button>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h4" component="h1">
            {isAdmin ? "Gestion de la carte" : "Disponibilité des produits"}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {isAdmin
              ? "Créez, modifiez ou supprimez les produits de chaque restaurant."
              : "Signalez les ruptures en un clic : le produit n'est plus commandable."}
          </Typography>
        </Box>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nouveau produit
          </Button>
        )}
      </Box>

      {!canLoad && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          Votre compte n'est rattaché à aucun restaurant : impossible d'afficher la carte.
        </Alert>
      )}

      {canLoad && (
        <>
          <Box
            sx={{
              mt: 3,
              mb: 2,
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: isAdmin ? "2fr 1fr 1fr" : "2fr 1fr" },
            }}
          >
            <TextField
              label="Rechercher un produit"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
            />
            <TextField
              select
              label="Catégorie"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="all">Toutes</MenuItem>
              {PRODUCT_CATEGORIES.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>
            {isAdmin && (
              <TextField
                select
                label="Restaurant"
                value={restaurantFilter}
                onChange={(e) => setRestaurantFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                size="small"
              >
                <MenuItem value="all">Tous</MenuItem>
                {restaurants.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>

          {status === "failed" && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={() => setReloadKey((k) => k + 1)}>
                  Réessayer
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 80 }} />
                  <TableCell>Produit</TableCell>
                  <TableCell align="right">Prix</TableCell>
                  <TableCell align="center">Disponible</TableCell>
                  {isAdmin && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {status === "loading" &&
                  Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={columnCount}>
                        <Skeleton variant="rounded" height={56} />
                      </TableCell>
                    </TableRow>
                  ))}

                {status === "succeeded" && visibleProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columnCount} align="center" sx={{ py: 5, color: "text.secondary" }}>
                      Aucun produit à afficher.
                    </TableCell>
                  </TableRow>
                )}

                {status === "succeeded" &&
                  visibleProducts.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        <Avatar variant="rounded" src={p.image} alt={p.name} sx={{ width: 56, height: 56 }} />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700 }}>{p.name}</Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                          <Chip size="small" label={categoryLabel(p.category)} />
                          {isAdmin && (
                            <Typography variant="caption" color="text.secondary">
                              {restaurantName(p.restaurant_id)}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                        {formatPrice(p.price)}
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={p.is_available}
                          disabled={pendingIds.has(p.id)}
                          onChange={(e) => {
                            void handleToggle(p, e.target.checked);
                          }}
                          slotProps={{ input: { "aria-label": `Disponibilité de ${p.name}` } }}
                        />
                      </TableCell>
                      {isAdmin && (
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <Tooltip title="Modifier">
                            <IconButton onClick={() => openEdit(p)} aria-label={`Modifier ${p.name}`}>
                              <EditOutlinedIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton color="error" onClick={() => setToDelete(p)} aria-label={`Supprimer ${p.name}`}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {formOpen && (
        <ProductFormDialog
          product={editing}
          restaurants={restaurants}
          defaultRestaurantId={scopeRestaurantId ?? null}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            setReloadKey((k) => k + 1);
          }}
        />
      )}

      <Dialog open={toDelete !== null} onClose={deleting ? undefined : () => setToDelete(null)}>
        <DialogTitle>Supprimer ce produit ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            « {toDelete?.name} » sera définitivement supprimé de la carte. Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToDelete(null)} disabled={deleting}>
            Annuler
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleting}
            onClick={() => {
              void handleDelete();
            }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
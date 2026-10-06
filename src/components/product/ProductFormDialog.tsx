import { useState, type FormEvent } from "react";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { createProduct, updateProduct } from "../../api/productApi";
import { useNotify } from "../common/NotificationContext";
import { PRODUCT_CATEGORIES, type Product } from "../../types/product";
import type { Restaurant } from "../../types/restaurant";
import { getErrorMessage } from "../../utils/errors";
import { validateRequired } from "../../utils/validators";

interface ProductFormDialogProps {
  product: Product | null; // null = création, sinon modification
  restaurants: Restaurant[];
  defaultRestaurantId: number | null;
  onClose: () => void;
  onSaved: () => void;
}

function parsePrice(value: string): number | null {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function ProductFormDialog({
  product,
  restaurants,
  defaultRestaurantId,
  onClose,
  onSaved,
}: ProductFormDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const notify = useNotify();
  const isEdit = product !== null;

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [price, setPrice] = useState(product !== null ? String(product.price) : "");
  const [restaurantId, setRestaurantId] = useState<number | "">(
    product?.restaurant_id ?? defaultRestaurantId ?? "",
  );
  const [image, setImage] = useState(product?.image ?? "");
  const [ingredients, setIngredients] = useState<string[]>(product?.ingredients ?? []);
  const [isAvailable, setIsAvailable] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Si la catégorie en base n'est pas dans la liste, on la garde quand même sélectionnable.
  const categoryOptions: ReadonlyArray<{ value: string; label: string }> =
    category === "" || PRODUCT_CATEGORIES.some((c) => c.value === category)
      ? PRODUCT_CATEGORIES
      : [...PRODUCT_CATEGORIES, { value: category, label: category }];

  const parsedPrice = parsePrice(price);
  const errors = {
    name: validateRequired(name, "Le nom"),
    description: validateRequired(description, "La description"),
    category: category === "" ? "La catégorie est requise." : null,
    price: parsedPrice === null ? "Saisissez un prix supérieur à 0 (ex : 8,90)." : null,
    restaurant: restaurantId === "" ? "Le restaurant est requis." : null,
    image: /^https?:\/\/\S+$/.test(image.trim()) ? null : "Saisissez un lien d'image valide (http:// ou https://).",
  };
  const hasErrors = Object.values(errors).some((message) => message !== null);
  const fieldError = (key: keyof typeof errors): string | null => (submitted ? errors[key] : null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitted(true);
    if (hasErrors || parsedPrice === null || restaurantId === "") return;

    const base = {
      name: name.trim(),
      description: description.trim(),
      category,
      price: parsedPrice,
      restaurant_id: restaurantId,
      image: image.trim(),
      ingredients,
    };

    setServerError(null);
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateProduct(product.id, base);
        notify(`« ${base.name} » mis à jour.`, "success");
      } else {
        await createProduct({ ...base, is_available: isAvailable });
        notify(`« ${base.name} » créé.`, "success");
      }
      onSaved();
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onClose={submitting ? undefined : onClose} fullScreen={fullScreen} fullWidth maxWidth="sm">
      <Box
        component="form"
        noValidate
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          void handleSubmit(e);
        }}
      >
        <DialogTitle>{isEdit ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>

        <DialogContent sx={{ display: "grid", gap: 2.5, pt: "8px !important" }}>
          {serverError !== null && <Alert severity="error">{serverError}</Alert>}

          <TextField
            label="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldError("name") !== null}
            helperText={fieldError("name") ?? " "}
            required
            fullWidth
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={fieldError("description") !== null}
            helperText={fieldError("description") ?? " "}
            multiline
            minRows={2}
            required
            fullWidth
          />

          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <TextField
              select
              label="Catégorie"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              error={fieldError("category") !== null}
              helperText={fieldError("category") ?? " "}
              required
            >
              {categoryOptions.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Prix (€)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              error={fieldError("price") !== null}
              helperText={fieldError("price") ?? " "}
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
              required
            />
          </Box>

          <TextField
            select
            label="Restaurant"
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value === "" ? "" : Number(e.target.value))}
            error={fieldError("restaurant") !== null}
            helperText={fieldError("restaurant") ?? " "}
            required
          >
            {restaurants.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.name} — {r.city}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            <TextField
              label="Lien de l'image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              error={fieldError("image") !== null}
              helperText={fieldError("image") ?? "Lien https:// vers une photo du produit."}
              required
              fullWidth
            />
            <Avatar variant="rounded" src={image.trim() || undefined} alt="Aperçu" sx={{ width: 56, height: 56 }} />
          </Box>

          <Autocomplete<string, true, false, true>
            multiple
            freeSolo
            autoSelect
            options={[]}
            value={ingredients}
            onChange={(_, value) => setIngredients(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Ingrédients"
                helperText="Tapez un ingrédient puis Entrée pour l'ajouter."
              />
            )}
          />

          {!isEdit && (
            <FormControlLabel
              control={<Switch checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />}
              label="Disponible dès la création"
            />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
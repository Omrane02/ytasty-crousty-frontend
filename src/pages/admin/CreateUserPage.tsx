import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { createUser } from "../../api/authApi";
import { useAppSelector } from "../../app/hooks";
import { PasswordField } from "../../components/common/PasswordField";
import { useNotify } from "../../components/common/NotificationContext";
import { selectRestaurants } from "../../features/restaurant/restaurantSlice";
import { ROLES, isRole, type Role } from "../../types/auth";
import { getErrorMessage } from "../../utils/errors";
import { validatePassword, validateRequired, validateUsername } from "../../utils/validators";

export function CreateUserPage() {
  const notify = useNotify();
  const restaurants = useAppSelector(selectRestaurants);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [restaurantId, setRestaurantId] = useState<number | "">("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const errors = {
    firstName: validateRequired(firstName, "Le prénom"),
    lastName: validateRequired(lastName, "Le nom"),
    username: validateUsername(username),
    password: validatePassword(password),
    restaurant:
      role === "staff" && restaurantId === "" ? "Un restaurant est requis pour le personnel." : null,
  };
  const hasErrors = Object.values(errors).some((message) => message !== null);
  const fieldError = (key: keyof typeof errors): string | null => (submitted ? errors[key] : null);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setUsername("");
    setPassword("");
    setRole("staff");
    setRestaurantId("");
    setSubmitted(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitted(true);
    if (hasErrors) return;

    setServerError(null);
    setSubmitting(true);
    try {
      const created = await createUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username,
        password,
        role,
        restaurant_id: role === "staff" && restaurantId !== "" ? restaurantId : null,
      });
      notify(`Compte « ${created.username} » créé.`, "success");
      resetForm();
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ py: { xs: 2, md: 4 }, maxWidth: 640, mx: "auto" }}>
      <Button component={RouterLink} to="/admin" sx={{ mb: 2 }}>
        ← Retour au back-office
      </Button>

      <Paper
        component="form"
        noValidate
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          void handleSubmit(e);
        }}
        sx={{ p: { xs: 3, md: 4 }, display: "grid", gap: 2.5 }}
      >
        <Typography variant="h4" component="h1">
          Créer un compte
        </Typography>

        {serverError !== null && <Alert severity="error">{serverError}</Alert>}

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
          <TextField
            label="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={fieldError("firstName") !== null}
            helperText={fieldError("firstName") ?? " "}
            required
          />
          <TextField
            label="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={fieldError("lastName") !== null}
            helperText={fieldError("lastName") ?? " "}
            required
          />
        </Box>

        <TextField
          label="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={fieldError("username") !== null}
          helperText={fieldError("username") ?? "8 à 12 caractères, lettres et chiffres uniquement."}
          autoComplete="off"
          required
        />

        <PasswordField
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          error={fieldError("password") !== null}
          helperText={
            fieldError("password") ?? "12 à 64 caractères avec une majuscule, un chiffre et un caractère spécial."
          }
        />

        <TextField
          select
          label="Rôle"
          value={role}
          onChange={(e) => {
            const value = e.target.value;
            if (isRole(value)) setRole(value);
          }}
          required
        >
          {ROLES.map((r) => (
            <MenuItem key={r} value={r}>
              {r}
            </MenuItem>
          ))}
        </TextField>

        {role === "staff" && (
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
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {submitting ? "Création..." : "Créer le compte"}
        </Button>
      </Paper>
    </Box>
  );
}
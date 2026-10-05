import { useState, type FormEvent } from "react";
import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Navigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { PasswordField } from "../components/common/PasswordField";
import { useNotify } from "../components/common/NotificationContext";
import { login, selectIsAuthenticated } from "../features/auth/authSlice";
import { getErrorMessage } from "../utils/errors";
import { validatePasswordLength, validateUsername } from "../utils/validators";


interface LocationState {
  from?: { pathname?: string };
}

export function LoginPage() {
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const state = location.state as LocationState | null;
  const redirectTo = state?.from?.pathname ?? "/admin";

  // Déjà connecté (ou connexion réussie) : on quitte la page de login.
  if (isAuthenticated) return <Navigate to={redirectTo} replace />;

  const usernameError = validateUsername(username);
  const passwordError = validatePasswordLength(password);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitted(true);
    if (usernameError !== null || passwordError !== null) return;

    setServerError(null);
    setSubmitting(true);
    try {
      await dispatch(login({ username, password })).unwrap();
      notify(`Bienvenue ${username} !`, "success");
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: { xs: 3, md: 8 } }}>
      <Paper
        component="form"
        noValidate
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          void handleSubmit(e);
        }}
        sx={{ width: "100%", maxWidth: 440, p: { xs: 3, md: 4 }, display: "grid", gap: 2.5 }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              mx: "auto",
              mb: 1.5,
              borderRadius: "50%",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "grid",
              placeItems: "center",
            }}
          >
            <LockOutlinedIcon />
          </Box>
          <Typography variant="h4" component="h1">
            Espace professionnel
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Réservé au personnel, à la direction et aux administrateurs.
          </Typography>
        </Box>

        {serverError !== null && <Alert severity="error">{serverError}</Alert>}

        <TextField
          label="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={submitted && usernameError !== null}
          helperText={submitted && usernameError !== null ? usernameError : " "}
          autoComplete="username"
          autoFocus
          fullWidth
          required
        />

        <PasswordField
          value={password}
          onChange={setPassword}
          error={submitted && passwordError !== null}
          helperText={submitted && passwordError !== null ? passwordError : " "}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {submitting ? "Connexion..." : "Se connecter"}
        </Button>
      </Paper>
    </Box>
  );
}
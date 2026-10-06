import { Box, Button, Card, CardContent, Chip, Typography } from "@mui/material";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { Link as RouterLink } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { selectCurrentUser } from "../../features/auth/authSlice";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";

export function BackOfficeHomePage() {
  const user = useAppSelector(selectCurrentUser);
  if (user === null) return null; // ProtectedRoute garantit un utilisateur connecté

  return (
    <Box sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Typography variant="h4" component="h1">
          Bonjour {user.username}
        </Typography>
        <Chip label={user.role} color="primary" size="small" />
      </Box>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
        Espace de gestion Ytasty Crousty.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
        }}
      >
        {user.role === "admin" && (
          <Card>
            <CardContent sx={{ display: "grid", gap: 1.5 }}>
              <Typography variant="h6">Comptes</Typography>
              <Typography color="text.secondary" variant="body2">
                Créer un compte staff, direction ou admin.
              </Typography>
              <Button
                component={RouterLink}
                to="/admin/users"
                variant="contained"
                startIcon={<PersonAddAlt1Icon />}
              >
                Créer un compte
              </Button>
            </CardContent>
          </Card>
        )}

        <Card sx={{ opacity: 0.6 }}>
          <CardContent>
            <Typography variant="h6">Commandes cuisine</Typography>
            <Typography color="text.secondary" variant="body2">
              Bientôt disponible.
            </Typography>
          </CardContent>
        </Card>

        {(user.role === "admin" || user.role === "staff") && (
        <Card>
            <CardContent sx={{ display: "grid", gap: 1.5 }}>
                <Typography variant="h6">{user.role === "admin" ? "Carte & produits" : "Disponibilité des produits"}</Typography>
                <Typography color="text.secondary" variant="body2">
                    {user.role === "admin"
                        ? "Créer, modifier ou supprimer les produits."
                        : "Signaler une rupture d'ingrédient en cuisine."}
                </Typography>
                <Button component={RouterLink} to="/admin/products" variant="contained" startIcon={<RestaurantMenuIcon />}>
                     Gérer la carte
                </Button>
            </CardContent>
        </Card>
)}
      </Box>
    </Box>
  );
}
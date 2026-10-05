import { Box, Button, Typography } from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import { Link as RouterLink } from "react-router-dom";

export function ForbiddenPage() {
  return (
    <Box sx={{ textAlign: "center", py: { xs: 6, md: 10 } }}>
      <BlockIcon sx={{ fontSize: 64, color: "error.main" }} />
      <Typography variant="h4" component="h1" sx={{ mt: 2 }}>
        Accès refusé
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
        Votre rôle ne vous permet pas d'accéder à cette page.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained">
        Retour à l'accueil
      </Button>
    </Box>
  );
}
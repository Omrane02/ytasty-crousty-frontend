import { Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { BackOfficeHomePage } from "../pages/admin/BackOfficeHomePage";
import { CreateUserPage } from "../pages/admin/CreateUserPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route
          path="menu"
          element={<PlaceholderPage title="La carte" description="La carte du restaurant arrive au prochain module." />}
        />
        <Route
          path="cart"
          element={<PlaceholderPage title="Mon panier" description="Le panier arrive au prochain module." />}
        />
        <Route path="login" element={<LoginPage />} />

        {/* Back-office : connexion obligatoire, puis filtrage par rôle */}
        <Route element={<ProtectedRoute allowedRoles={["staff", "admin", "direction"]} />}>
          <Route path="admin" element={<BackOfficeHomePage />} />
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="admin/users" element={<CreateUserPage />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={<PlaceholderPage title="Page introuvable" description="Cette page n'existe pas." />}
        />
      </Route>
    </Routes>
  );
}
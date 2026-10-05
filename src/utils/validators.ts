export function validateRequired(value: string, label: string): string | null {
  return value.trim().length === 0 ? `${label} est requis.` : null;
}

export function validateUsername(value: string): string | null {
  if (value.length === 0) return "Le nom d'utilisateur est requis.";
  if (value.length < 8 || value.length > 12) return "Le nom d'utilisateur doit faire entre 8 et 12 caractères.";
  if (!/^[a-zA-Z0-9]+$/.test(value)) return "Lettres et chiffres uniquement (sans espace ni accent).";
  return null;
}

export function validatePasswordLength(value: string): string | null {
  if (value.length === 0) return "Le mot de passe est requis.";
  if (value.length < 12) return "Le mot de passe doit faire au moins 12 caractères.";
  if (value.length > 64) return "Le mot de passe ne peut pas dépasser 64 caractères.";
  return null;
}

export function validatePasswordStrength(value: string): string | null {
  if (!/\d/.test(value)) return "Le mot de passe doit contenir au moins un chiffre.";
  if (!/[A-Z]/.test(value)) return "Le mot de passe doit contenir au moins une majuscule.";
  if (!/[^a-zA-Z0-9]/.test(value)) return "Le mot de passe doit contenir au moins un caractère spécial.";
  return null;
}

// Création de compte : longueur + robustesse (à la connexion, seule la longueur est vérifiée)
export function validatePassword(value: string): string | null {
  return validatePasswordLength(value) ?? validatePasswordStrength(value);
}
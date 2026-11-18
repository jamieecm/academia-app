export type AuthFlow = "login" | "register" | "forgot" | "reset";

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string): string | null {
  const email = normalizeEmail(value);

  if (!email) return "Escribe tu correo electrónico.";
  if (email.length > 254) {
    return "El correo no puede superar los 254 caracteres.";
  }

  const [localPart, domain, ...extraParts] = email.split("@");
  if (
    extraParts.length > 0 ||
    !localPart ||
    !domain ||
    localPart.length > 64 ||
    !domain.includes(".") ||
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..") ||
    domain.startsWith(".") ||
    domain.endsWith(".") ||
    domain
      .split(".")
      .some((label) => !label || label.startsWith("-") || label.endsWith("-")) ||
    /\s/.test(email)
  ) {
    return "Escribe un correo válido, por ejemplo nombre@dominio.com.";
  }

  return null;
}

export function validateNewPassword(password: string): string | null {
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }

  return null;
}

function getErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }

  return typeof error.code === "string" ? error.code : null;
}

function getWeakPasswordMessage(error: unknown): string {
  const reasons =
    typeof error === "object" &&
    error !== null &&
    "reasons" in error &&
    Array.isArray(error.reasons)
      ? error.reasons
      : [];
  const messages: Record<string, string> = {
    length: "usa una contraseña más larga",
    characters: "incluye los tipos de caracteres exigidos",
    pwned: "elige una contraseña que no aparezca en filtraciones conocidas",
  };
  const details = reasons
    .filter((reason): reason is string => typeof reason === "string")
    .map((reason) => messages[reason])
    .filter(Boolean);

  return details.length > 0
    ? `La contraseña no cumple los requisitos de Supabase: ${details.join(", y ")}.`
    : "La contraseña no cumple los requisitos de seguridad configurados.";
}

export function getAuthErrorMessage(error: unknown, flow: AuthFlow): string {
  switch (getErrorCode(error)) {
    case "invalid_credentials":
      return "Correo o contraseña incorrectos.";
    case "email_not_confirmed":
      return "Confirma tu correo desde el enlace que te enviamos antes de iniciar sesión.";
    case "email_exists":
    case "user_already_exists":
      return "Este correo ya está asociado a una cuenta. Inicia sesión o restablece tu contraseña.";
    case "email_address_invalid":
    case "validation_failed":
      return "Revisa el formato del correo y los requisitos de la contraseña.";
    case "weak_password":
      return getWeakPasswordMessage(error);
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Se hicieron demasiados intentos. Espera un momento antes de volver a probar.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "El registro por correo está temporalmente deshabilitado.";
    default:
      if (flow === "login") {
        return "No se pudo iniciar sesión. Revisa tus datos e inténtalo nuevamente.";
      }
      if (flow === "forgot") {
        return "No fue posible procesar la solicitud. Inténtalo nuevamente.";
      }
      if (flow === "reset") {
        return "No fue posible actualizar la contraseña. Solicita un nuevo enlace de recuperación.";
      }
      return "No se pudo crear la cuenta. Revisa tus datos e inténtalo nuevamente.";
  }
}

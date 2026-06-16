/**
 * Supabase auth xatolari ko'pincha inglizcha va texnik bo'ladi
 * (masalan "AuthApiError: Invalid login credentials").
 * Bu yordamchi ularni foydalanuvchiga tushunarli i18n kalitiga aylantiradi.
 *
 * Foydalanish: toast.error(..., { description: t(authErrorKey(error.message)) })
 */
export function authErrorKey(message?: string | null): string {
  const m = (message ?? "").toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "auth.errInvalidCredentials";
  }
  if (m.includes("email not confirmed")) {
    return "auth.errEmailNotConfirmed";
  }
  if (
    m.includes("already registered") ||
    m.includes("already been registered") ||
    m.includes("user already exists")
  ) {
    return "auth.errAlreadyRegistered";
  }
  if (m.includes("rate limit") || m.includes("too many requests")) {
    return "auth.errRateLimit";
  }
  if (m.includes("password should be") || m.includes("weak password")) {
    return "auth.errWeakPassword";
  }
  if (
    m.includes("unable to validate email") ||
    m.includes("invalid email") ||
    m.includes("invalid format")
  ) {
    return "auth.errInvalidEmail";
  }
  if (
    m.includes("network") ||
    m.includes("failed to fetch") ||
    m.includes("load failed")
  ) {
    return "auth.errNetwork";
  }

  return "auth.errGeneric";
}

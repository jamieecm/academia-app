"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { createClient } from "../src/lib/supabase/client";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        if (data.session) {
          router.replace("/onboarding");
          router.refresh();
          return;
        }

        setSuccess(
          "¡Cuenta creada con éxito! Revisa tu correo para confirmar tu dirección y activar tu cuenta."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Consultar el estado real del perfil.
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("No se pudo verificar la sesión.");
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        const destination = profile?.onboarding_completed
          ? "/dashboard"
          : "/onboarding";

        router.replace(destination);
        router.refresh();
        return;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado. Inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setPassword("");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090D09] px-4 py-10 text-white sm:px-6">
      {/* Destellos de luz ambiental de fondo */}
      <div className="pointer-events-none absolute -left-40 top-1/4 h-[400px] w-[400px] rounded-full bg-[#36D414]/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[400px] w-[400px] rounded-full bg-[#36D414]/10 blur-[150px]" />

      <div className="relative z-10 w-full max-w-[440px]">

        {/* Cabecera / Identidad */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full bg-white shadow-[0_0_30px_rgba(54,212,20,0.25)]">
            <Image
              src="/escudo-academia.png"
              alt="Escudo Academia Fútbol AF"
              fill
              priority
              className="object-contain"
              sizes="80px"
            />
          </div>

          <h1 className="text-xl font-black uppercase tracking-tight">
            Academia Fútbol
          </h1>
          <p className="mt-1 text-xs font-bold tracking-[0.25em] text-[#36D414]">
            PLATAFORMA PARA JUGADORES
          </p>
        </div>

        {/* Tarjeta de Autenticación */}
        <div className="rounded-3xl border border-white/10 bg-[#0D150D]/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">

          {/* Título dinámico según el modo */}
          <div className="mb-6 text-center">
            <h2 className="text-xl font-black tracking-tight">
              {mode === "login" ? "¡QUÉ BUENO VERTE!" : "¡MEJOREMOS JUNTOS!"}
            </h2>
            <p className="mt-1.5 min-h-[32px] text-xs text-gray-400">
              {mode === "login"
                ? "Ingresa a tu cuenta para continuar tu historia."
                : "Crea tu perfil y comienza a construir tu identidad."}
            </p>
          </div>

          {/* Selector de Pestañas (UX Moderno) */}
          <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/10 bg-[#111711] p-1">
            <button
              type="button"
              onClick={() => changeMode("login")}
              className={`rounded-lg py-2.5 text-xs font-bold transition-all duration-200 ${mode === "login"
                ? "bg-[#36D414] text-black shadow-md"
                : "text-gray-400 hover:text-white"
                }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => changeMode("register")}
              className={`rounded-lg py-2.5 text-xs font-bold transition-all duration-200 ${mode === "register"
                ? "bg-[#36D414] text-black shadow-md"
                : "text-gray-400 hover:text-white"
                }`}
            >
              Crear cuenta
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Correo electrónico */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-300"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="acadademia@correo.com"
                  required
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#111711] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#36D414] focus:ring-2 focus:ring-[#36D414]/10"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-300"
              >
                Contraseña
              </label>
              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#111711] pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#36D414] focus:ring-2 focus:ring-[#36D414]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-[#36D414]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Espacio fijo compartido entre ambos modos */}
              <div className="mt-1.5 flex min-h-[20px] items-center justify-between">
                {mode === "register" ? (
                  <p className="text-[11px] text-gray-500">
                    Mínimo 8 caracteres.
                  </p>
                ) : (
                  <a
                    href="/forgot-password"
                    className="ml-auto text-xs font-semibold text-[#36D414] hover:text-[#70f34e]"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                )}
              </div>
            </div>

            {/* Alerta de Error */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300"
              >
                {error}
              </div>
            )}

            {/* Alerta de Éxito */}
            {success && (
              <div
                role="status"
                className="rounded-xl border border-[#36D414]/20 bg-[#36D414]/10 p-3 text-xs leading-relaxed text-[#9AF47F]"
              >
                {success}
              </div>
            )}

            {/* Botón de Acción Principal */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#36D414] text-sm font-black uppercase tracking-wide text-black shadow-[0_5px_20px_rgba(54,212,20,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#48e51d] hover:shadow-[0_8px_25px_rgba(54,212,20,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Procesando..."
                : mode === "login"
                  ? "Ingresar"
                  : "Crear"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Enlace alternativo pie de tarjeta */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => changeMode(mode === "login" ? "register" : "login")}
              className="text-xs text-gray-400 transition hover:text-white"
            >
              {mode === "login" ? (
                <>
                  ¿No tienes cuenta?{" "}
                  <span className="font-bold text-[#36D414]">
                    Regístrate aquí.
                  </span>
                </>
              ) : (
                <>
                  ¿Ya tienes cuenta?{" "}
                  <span className="font-bold text-[#36D414]">
                    Inicia sesión.
                  </span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Seguridad y Copyright */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
          <p className="mt-4 text-center text-[11px] text-gray-600">
            © 2027 Academia Fútbol.<br />Todos los derechos reservados.
          </p>
        </div>

      </div>
    </main>
  );
}
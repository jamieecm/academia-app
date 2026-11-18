"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { LockKeyhole, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getAuthErrorMessage,
  validateNewPassword,
} from "@/src/lib/auth/validation";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const passwordValidation = validateNewPassword(password);
    if (passwordValidation) {
      setError(passwordValidation);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setSuccess("Tu contraseña se actualizó correctamente.");

      setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 1800);

    } catch (err) {
      setError(getAuthErrorMessage(err, "reset"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#090D09] px-6 py-12 text-white">
      {/* Tarjeta del formulario */}
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111711] p-8">

        {/* Encabezado en horizontal */}
        <div className="mb-6 flex items-center gap-4">
          {/* Icono */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#36D414]/10 text-[#36D414]">
            <LockKeyhole size={24} />
          </div>

          {/* Título */}
          <h1 className="text-xl font-black leading-tight tracking-tight">
            NUEVA CONTRASEÑA
          </h1>
        </div>

        <p className="mt-3 text-sm leading-6 text-gray-400">
          Establece una nueva contraseña para recuperar el acceso a tu cuenta.
        </p>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">

          {/* Nueva contraseña */}
          <div>
            <label 
              htmlFor="password" 
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-300"
            >
              Nueva contraseña
            </label>
            <div className="relative">
              <LockKeyhole
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-white/10 bg-[#111711] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#36D414] focus:ring-2 focus:ring-[#36D414]/10"
              />
            </div>
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label 
              htmlFor="confirmPassword" 
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-300"
            >
              Confirmar contraseña
            </label>
            <div className="relative">
              <LockKeyhole
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-white/10 bg-[#111711] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#36D414] focus:ring-2 focus:ring-[#36D414]/10"
              />
            </div>
          </div>

          {/* Mensaje de éxito */}
          {success && (
            <p 
              role="status" 
              className="w-full rounded-lg border border-[#36D414]/20 bg-[#36D414]/10 p-3 text-sm leading-5 text-[#8CF56D]"
            >
              {success}
            </p>
          )}

          {/* Mensaje de error */}
          {error && (
            <p 
              role="alert" 
              className="w-full rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm leading-5 text-red-300"
            >
              {error}
            </p>
          )}

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#36D414] text-sm font-black uppercase tracking-wide text-black shadow-[0_5px_20px_rgba(54,212,20,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#48e51d] hover:shadow-[0_8px_25px_rgba(54,212,20,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              "ACTUALIZANDO..."
            ) : (
              <span className="flex items-center gap-2">
                ACTUALIZAR<ArrowRight size={18} />
              </span>
            )}
          </button>

        </form>
      </div>

      {/* Footer ubicado exactamente abajo del formulario */}
      <footer className="mt-6 text-center text-[11px] text-gray-600">
        <p>© 2027 Academia Fútbol.<br />Todos los derechos reservados.</p>
      </footer>
    </main>
  );
}

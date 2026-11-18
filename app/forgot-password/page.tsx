"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";
import { ArrowLeft, Mail, ArrowRight } from "lucide-react";
import {
  getAuthErrorMessage,
  normalizeEmail,
  validateEmail,
} from "@/src/lib/auth/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");

    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setError(emailValidation);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizeEmail(email),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        }
      );

      if (error) throw error;

      setMessage(
        "Si existe una cuenta asociada a este correo, recibirás instrucciones para recuperar tu contraseña."
      );
    } catch (err) {
      setError(getAuthErrorMessage(err, "forgot"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#090D09] px-6 py-12 text-white">
      {/* Tarjeta del formulario */}
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111711] p-8">

        {/* Volver */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-[#36D414]"
        >
          <ArrowLeft size={17} />
          Volver al inicio
        </Link>

        {/* Encabezado en horizontal */}
        <div className="mb-6 flex items-center gap-4">
          {/* Icono */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#36D414]/10 text-[#36D414]">
            <Mail size={24} />
          </div>

          {/* Título */}
          <h1 className="text-xl font-black leading-tight tracking-tight">
            RECUPERAR CONTRASEÑA
          </h1>
        </div>

        <p className="mt-3 text-sm leading-6 text-gray-400">
          Introduce tu correo y te enviaremos las instrucciones
          para recuperar el acceso a tu cuenta.
        </p>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">

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
                maxLength={254}
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="h-12 w-full rounded-xl border border-white/10 bg-[#111711] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#36D414] focus:ring-2 focus:ring-[#36D414]/10"
              />
            </div>
          </div>

          {/* Mensaje de éxito */}
          {message && (
            <p
              role="status"
              className="w-full rounded-lg border border-[#36D414]/20 bg-[#36D414]/10 p-3 text-sm leading-5 text-[#8CF56D]"
            >
              {message}
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
              "ENVIANDO..."
            ) : (
              <span className="flex items-center gap-2">
                ENVIAR <ArrowRight size={18} />
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

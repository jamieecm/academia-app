"use server";

import { resend } from "@/src/lib/resend";

export async function sendWelcomeEmail(email: string) {
  try {
    const { data, error } = await resend.emails.send({
      // Si aún no tienes un dominio verificado en Resend, 
      // puedes usar "onboarding@resend.dev" para pruebas (solo llega a tu correo registrado).
      from: "Academia Fútbol <onboarding@resend.dev>", 
      to: [email],
      subject: "¡Bienvenido a Academia Fútbol!",
      html: `
        <div style="font-family: sans-serif; background-color: #090D09; color: #ffffff; padding: 30px; border-radius: 12px;">
          <h1 style="color: #36D414;">¡Qué bueno tenerte aquí!</h1>
          <p>Tu cuenta en Academia Fútbol ha sido creada con éxito.</p>
          <p>Prepárate para llevar tu juego al siguiente nivel.</p>
        </div>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Error desconocido al enviar correo" 
    };
  }
}
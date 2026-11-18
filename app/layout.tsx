import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Academia App",
  description:
    "Crea tu perfil futbolístico, consigue tu Player Card y evoluciona como jugador.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
  {children}
</body>
    </html>
  );
}
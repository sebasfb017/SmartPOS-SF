import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "Parador Pro - Gestión Integral",
  description: "Sistema de gestión para ventas, inventario y nómina.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            <AuthGuard>{children}</AuthGuard>
          </main>
        </div>
      </body>
    </html>
  );
}

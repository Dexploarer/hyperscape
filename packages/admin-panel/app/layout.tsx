import type { Metadata } from "next";
import "./globals.css";
import AdminShell from "@/components/layout/admin-shell";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Hyperscape Admin | Void Glass",
  description: "Visual Command Center for Hyperscape",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <AdminShell>{children}</AdminShell>
        <Toaster />
      </body>
    </html>
  );
}

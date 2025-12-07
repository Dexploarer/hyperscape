import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hyperforge",
  description: "AI Asset Factory",
};

import { Sidebar } from "@/components/sidebar";
import { ToastProvider } from "@/components/ui/toast";

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased bg-background text-foreground h-screen w-screen overflow-hidden transition-colors duration-300`}
      >
        <ThemeProvider defaultTheme="dark" storageKey="hyperforge-theme">
          <main className="flex h-full w-full">
            <ToastProvider>
              <Sidebar />
              <div className="flex-1 overflow-hidden relative">{children}</div>
            </ToastProvider>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

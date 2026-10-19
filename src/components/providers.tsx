"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { CommandPalette } from "@/components/layout/command-palette";
import { SessionInit } from "@/components/providers/session-init";
import { useState, type ReactNode } from "react";

/** Root client providers: theme, TanStack Query, Sonner, Command Palette, session init. */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // 30s
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SessionInit />
        {children}
        <CommandPalette />
        <Toaster position="bottom-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Organization, User } from "@/lib/db/types";

/**
 * Mock auth session. In a real deployment this would be backed by Firebase Auth;
 * here it holds the active demo user, their organization, and the theme pref.
 * Persisted to localStorage so the chosen role survives reloads.
 */

export type ThemePref = "light" | "dark" | "system";

interface AuthState {
  user: User | null;
  organization: Organization | null;
  theme: ThemePref;
  setSession: (user: User, organization: Organization) => void;
  switchUser: (user: User) => void;
  setTheme: (theme: ThemePref) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      organization: null,
      theme: "system",
      setSession: (user, organization) => set({ user, organization }),
      switchUser: (user) => set({ user }),
      setTheme: (theme) => set({ theme }),
      signOut: () => set({ user: null, organization: null }),
    }),
    {
      name: "startupos-auth",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { db } from "@/lib/db";
import { ORG_ID } from "@/lib/db/mock/store";

/**
 * On first mount, resolve the demo org + default user into the Zustand auth
 * store so every client component can access the current session without a real
 * auth flow. Idempotent — won't overwrite if the user already picked a role.
 */
export function SessionInit() {
  const { user, setSession } = useAuthStore();

  useEffect(() => {
    if (user) return; // already initialized

    (async () => {
      const org = await db.organizations.get(ORG_ID, ORG_ID);
      const users = await db.users.list(ORG_ID);
      const owner = users.find((u) => u.role === "owner") ?? users[0];
      if (org && owner) {
        setSession(owner, org);
      }
    })();
  }, [user, setSession]);

  return null;
}

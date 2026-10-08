import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

import type { Database } from "./database.types";
import { publicEnv } from "./env";

/**
 * Request-scoped Supabase client for Server Components, Server Actions and Route Handlers.
 * Runs as the signed-in user, so every query is subject to RLS. Create one per request.
 */
export async function createClient() {
  // Session checks compare token expiry with the current time, which Cache Components only
  // allows once rendering is tied to a real request.
  await connection();
  const cookieStore = await cookies();
  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet)
              cookieStore.set(name, value, options);
          } catch {
            // Server Components cannot set cookies; the proxy refreshes the session instead.
          }
        },
      },
    },
  );
}

export type ServerClient = Awaited<ReturnType<typeof createClient>>;

import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

/** Routes that need a signed-in player. Authorization itself is enforced by RLS. */
const PROTECTED_PREFIXES = [
  "/adventure",
  "/quests",
  "/calendar",
  "/character",
  "/settings",
  "/onboarding",
];
const AUTH_PAGES = ["/login"];

export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  // Redirects must carry any cookies written while refreshing the session.
  const redirect = (url: URL) => {
    const res = NextResponse.redirect(url);
    for (const cookie of response().cookies.getAll()) res.cookies.set(cookie);
    return res;
  };

  if (!userId && PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return redirect(login);
  }

  if (userId && AUTH_PAGES.includes(pathname)) {
    return redirect(new URL("/adventure", request.url));
  }

  return response();
}

export const config = {
  // Skip static assets, images and metadata files.
  matcher: [
    "/((?!_next/static|_next/image|sprites|icons|fonts|icon.png|opengraph-image|favicon.ico).*)",
  ],
};

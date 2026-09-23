import { NextResponse, type NextRequest } from "next/server";
import {
  canAccessSpace,
  homePathForRoles,
  type AppRole,
} from "@titan-kinetic/core";
import { createMiddlewareClient } from "./lib/supabase/middleware";

const PROTECTED_SPACES = [
  "admin",
  "formateur",
  "entreprise",
  "apprenant",
] as const;
const AUTH_PATHS = ["/connexion", "/inscription", "/mot-de-passe-oublie"];

export async function proxy(request: NextRequest) {
  const middleware = await createMiddlewareClient(request);
  const { supabase } = middleware;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  function redirectWithCookies(url: URL) {
    const result = NextResponse.redirect(url);
    middleware.response.cookies
      .getAll()
      .forEach((cookie) => result.cookies.set(cookie));
    return result;
  }

  const { pathname } = request.nextUrl;
  const space = PROTECTED_SPACES.find(
    (s) => pathname === `/${s}` || pathname.startsWith(`/${s}/`),
  );

  if (space) {
    if (!user) {
      const redirectUrl = new URL("/connexion", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return redirectWithCookies(redirectUrl);
    }

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roles = (roleRows ?? []).map((r) => r.role as AppRole);

    if (!canAccessSpace(roles, space)) {
      return redirectWithCookies(new URL(homePathForRoles(roles), request.url));
    }

    return middleware.response;
  }

  if (user && AUTH_PATHS.includes(pathname)) {
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roles = (roleRows ?? []).map((r) => r.role as AppRole);
    return redirectWithCookies(new URL(homePathForRoles(roles), request.url));
  }

  return middleware.response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

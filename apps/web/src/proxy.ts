import { NextResponse, type NextRequest } from "next/server";
import { canAccessSpace, homePathForRoles, type AppRole } from "@titan-kinetic/core";
import { createMiddlewareClient } from "./lib/supabase/middleware";

const PROTECTED_SPACES = ["admin", "formateur", "entreprise", "apprenant"] as const;
const AUTH_PATHS = ["/connexion", "/inscription", "/mot-de-passe-oublie"];

export async function proxy(request: NextRequest) {
  const { supabase, response } = await createMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const space = PROTECTED_SPACES.find(
    (s) => pathname === `/${s}` || pathname.startsWith(`/${s}/`),
  );

  if (space) {
    if (!user) {
      const redirectUrl = new URL("/connexion", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    const { data: roleRows } = await supabase.from("user_roles").select("role");
    const roles = (roleRows ?? []).map((r) => r.role as AppRole);

    if (!canAccessSpace(roles, space)) {
      return NextResponse.redirect(new URL(homePathForRoles(roles), request.url));
    }

    return response;
  }

  if (user && AUTH_PATHS.includes(pathname)) {
    const { data: roleRows } = await supabase.from("user_roles").select("role");
    const roles = (roleRows ?? []).map((r) => r.role as AppRole);
    return NextResponse.redirect(new URL(homePathForRoles(roles), request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

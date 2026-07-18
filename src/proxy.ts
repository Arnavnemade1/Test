import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "vault_session";

function secretKey() {
  return new TextEncoder().encode(process.env.SESSION_SECRET);
}

async function readRole(req: NextRequest): Promise<"ADMIN" | "USER" | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return (payload.role as "ADMIN" | "USER") ?? null;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const role = await readRole(req);
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  if (pathname.startsWith("/vault")) {
    const role = await readRole(req);
    if (!role) {
      return NextResponse.redirect(new URL("/access", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/vault/:path*"],
};

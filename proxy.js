import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase/config";

// Runs before every page request: keeps the Supabase login session fresh
// and sends signed-out visitors away from private areas.
const PRIVATE_PATHS = ["/dashboard", "/admin", "/checkout", "/reset-password"];

export async function proxy(request) {
  try {
    return await refreshSession(request);
  } catch (error) {
    // Never take the whole site down because of a session problem
    console.error("proxy: session refresh failed", error);
    return NextResponse.next({ request });
  }
}

async function refreshSession(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  if (!user && PRIVATE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Skip static files, images and the health check
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|m4a)$).*)"],
};

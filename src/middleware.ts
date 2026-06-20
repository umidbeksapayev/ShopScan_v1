import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Routing UX uchun getSession() — getUser()'dan farqli o'laroq, valid token'da
  // SERVERGA tarmoq so'rovi YUBORMAYDI (cookie'dan o'qiydi; muddati o'tsa
  // avtomatik yangilaydi). Bu har sahifa o'tishidagi kechikishni yo'qotadi.
  // XAVFSIZLIK CHEGARASI — RLS: har ma'lumot so'rovi server tomonda token bilan
  // tekshiriladi; middleware faqat yo'naltirish (soxta cookie sahifaga yetsa ham
  // RLS ma'lumot bermaydi). Maxfiy sahifalar o'z server-tekshiruviga ega.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith("/login") || path.startsWith("/register");
  const isLanding = path === "/";
  // Landing va auth sahifalari ochiq (login talab qilinmaydi)
  const isPublic = isAuthPage || isLanding;

  // Login qilmagan foydalanuvchi himoyalangan sahifaga kirsa → login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Login qilgan foydalanuvchi landing yoki auth sahifaga kirsa → dashboard
  if (user && (isAuthPage || isLanding)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // /admin — faqat super_admin (RBAC)
  if (user && path.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // /api/* — server route'lar o'z auth'ini boshqaradi (Telegram webhook auth'siz
    //   kelishi shart). PWA fayllari (sw.js, manifest, ikonalar) ham redirect'siz.
    "/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

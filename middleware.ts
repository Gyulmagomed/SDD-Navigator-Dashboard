/**
 * Защита маршрутов дашборда: проверка JWT NextAuth без полной загрузки страницы.
 *
 * Публичный путь — /login (залогиненных сюда не пускаем обратно без выхода — см. логику ниже).
 * Новые защищённые разделы добавляйте в config.matcher (и при необходимости в Sidebar).
 */
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/coverage",
    "/specifications",
    "/specifications/:path*",
    "/reports",
    "/reports/:path*",
    "/login",
  ],
};

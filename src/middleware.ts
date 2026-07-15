export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: [
    "/(dashboard|leads|pipeline|analytics|settings)/:path*",
  ],
}

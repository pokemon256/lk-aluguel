export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/materiais/:path*",
    "/clientes/:path*",
    "/alugueres/:path*",
    "/calendario/:path*",
    "/analises/:path*",
    "/financas/:path*",
  ],
};

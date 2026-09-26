import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireDb } from "./lib/db";
import { users } from "./lib/schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Entrar",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Palavra-passe", type: "password" },
      },
      async authorize(raw) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(raw);
        if (!parsed.success) return null;
        const db = requireDb();
        const [u] = await db
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email.toLowerCase()));
        if (!u) return null;
        const ok = await bcrypt.compare(parsed.data.password, u.passwordHash);
        if (!ok) return null;
        return { id: u.id, email: u.email, name: u.nome };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
  },
});

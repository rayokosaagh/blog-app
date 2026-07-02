import "./types";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { UserRole } from "./types";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        // OAuth-only accounts (readers) have no password set
        if (!user || !user.password) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          image: user.image ?? null,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (user && account) {
        if (account.provider === "credentials") {
          token.id = user.id as string;
          token.role = user.role as UserRole;
          token.image = user.image as string | null;
        } else {
          // Google / GitHub sign-in for public readers.
          // We don't use the Prisma adapter (would require Account/session-table
          // changes and switch session strategy to "database"), so we upsert
          // the User row ourselves and keep everything on JWT sessions.
          if (!user.email) return token;

          const dbUser = await prisma.user.upsert({
            where: { email: user.email },
            update: {
              name: user.name ?? undefined,
              image: user.image ?? undefined,
            },
            create: {
              email: user.email,
              name: user.name,
              image: user.image,
              role: "READER",
              // password stays null — this account can only sign in via OAuth
            },
          });

          token.id = dbUser.id;
          token.role = dbUser.role as UserRole;
          token.image = dbUser.image;
        }
      }

      // Re-fetch image from DB when session is updated (e.g. after admin changes avatar)
      if (trigger === "update" && session?.image !== undefined) {
        token.image = session.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.image = token.image as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
  },
  session: { strategy: "jwt" },
});
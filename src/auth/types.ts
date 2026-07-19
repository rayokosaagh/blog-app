import { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

export type UserRole = "ADMIN" | "EDITOR" | "READER";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      image?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    image?: string | null;
  }
}
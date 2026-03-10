import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      role: "ADMIN" | "MANAGER" | "VIEWER";
      tenant?: {
        id: string;
        name: string;
        slug: string;
        plan: string;
      };
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    tenantId: string;
    role: "ADMIN" | "MANAGER" | "VIEWER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tenantId: string;
    role: "ADMIN" | "MANAGER" | "VIEWER";
  }
}

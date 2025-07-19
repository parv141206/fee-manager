import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma"; // <--- CORRECT: Import the singleton client

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Add a log to see if this function is being called correctly
        console.log("Authorizing with credentials:", credentials?.username);

        if (!credentials?.username || !credentials.password) {
          console.log("Missing credentials");
          return null;
        }

        // Use the imported prisma client
        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
        });

        if (!user) {
          console.log("User not found:", credentials.username);
          return null;
        }

        console.log("User found:", user.username);

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          console.log("Password invalid for user:", user.username);
          return null;
        }

        console.log("Password valid. Logging in user:", user.username);
        return { id: user.id, name: user.username };
      },
    }),
  ],
  pages: {
    signIn: "/", // Redirect users to the homepage for login
  },
});

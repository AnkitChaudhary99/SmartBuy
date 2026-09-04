import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import UserModel from "./models/user.model";
import { connectToDB } from "./mongoose";


export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error(
            "Please enter your email and password."
          );
        }

        const email = credentials.email
          .trim()
          .toLowerCase();

        const password = credentials.password;

        try {
          await connectToDB();

          const user = await UserModel.findOne({
            email,
          });

          if (!user) {
            throw new Error(
              "No account found with this email."
            );
          }

          const passwordMatches =
            await bcrypt.compare(
              password,
              user.password
            );

          if (!passwordMatches) {
            throw new Error(
              "Incorrect password."
            );
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          };
        } catch (error: any) {
          console.log(
            "Authentication error:",
            error
          );

          throw new Error(
            error?.message ||
              "Unable to sign in."
          );
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },

  pages: {
    signIn: "/sign-in",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
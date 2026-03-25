import axios from "axios";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

type ExtendedToken = JWT;

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const refreshAccessToken = async (token: ExtendedToken): Promise<ExtendedToken> => {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  try {
    const response = await axios.post<RefreshResponse>(`${apiBaseUrl}/auth/refresh`, {
      refreshToken: token.refreshToken,
    });

    return {
      ...token,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken ?? token.refreshToken,
      accessTokenExpires: Date.now() + response.data.expiresIn * 1000,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        try {
          const response = await axios.post<LoginResponse>(`${apiBaseUrl}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });

          return {
            id: response.data.user.id,
            email: response.data.user.email,
            name: response.data.user.name ?? response.data.user.email,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            accessTokenExpires: Date.now() + response.data.expiresIn * 1000,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const nextToken: ExtendedToken = { ...token };

      if (user) {
        const typedUser = user as unknown as {
          accessToken: string;
          refreshToken: string;
          accessTokenExpires: number;
          email?: string;
          name?: string;
        };

        nextToken.accessToken = typedUser.accessToken;
        nextToken.refreshToken = typedUser.refreshToken;
        nextToken.accessTokenExpires = typedUser.accessTokenExpires;
        nextToken.email = typedUser.email ?? null;
        nextToken.name = typedUser.name ?? null;

        return nextToken;
      }

      if (
        typeof nextToken.accessTokenExpires === "number" &&
        Date.now() < nextToken.accessTokenExpires - 30_000
      ) {
        return nextToken;
      }

      return refreshAccessToken(nextToken);
    },
    async session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.email = token.email ?? session.user.email ?? "";
      session.user.name = token.name ?? session.user.name ?? "";
      session.user.accessToken = (token as ExtendedToken).accessToken ?? "";
      session.user.error = (token as ExtendedToken).error;
      return session;
    },
  },
};

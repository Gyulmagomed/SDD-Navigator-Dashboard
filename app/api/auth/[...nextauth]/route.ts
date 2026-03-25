import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        if (
          credentials?.email === "test@test.com" &&
          credentials?.password === "123456"
        ) {
          return {
            id: "1",
            name: "Test User",
            email: "test@test.com",
            accessToken: "mock-token",
          }
        }

        return null
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const withToken = user as typeof user & { accessToken?: string };
        token.accessToken = withToken.accessToken;
      }
      return token
    },

    async session({ session, token }) {
      // пробрасываем токен в session
      if (session.user) {
        session.user.accessToken = token.accessToken as string
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
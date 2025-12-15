import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [Google({
        clientId: process.env.DATA_API_GOOGLE_CLIENT_ID,
        clientSecret: process.env.DATA_API_GOOGLE_CLIENT_SECRET,
    })],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized: async ({ auth }) => {
            // Logged in users are authenticated, otherwise redirect to login page
            return !!auth
        },
    },
})

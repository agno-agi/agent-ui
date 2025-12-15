import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    // Disable auth in local development
    const isLocalDev = process.env.DISABLE_AUTH === 'true'

    if (isLocalDev) {
        // Skip all auth checks in local dev
        return
    }

    const isLoggedIn = !!req.auth
    const isOnLoginPage = req.nextUrl.pathname.startsWith('/login')

    if (isOnLoginPage) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL('/', req.nextUrl))
        }
        return
    }

    if (!isLoggedIn) {
        return NextResponse.redirect(new URL('/login', req.nextUrl))
    }
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

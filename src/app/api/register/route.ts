import { prisma } from "@/lib/db"
import { hashPassword } from "@/lib/password"
import { NextResponse } from "next/server"
import { z } from "zod"

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, password, name } = registerSchema.parse(body)

        console.log("Register: Parsed body", { email, name })

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        console.log("Register: Checked existing user", existingUser)

        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 400 }
            )
        }

        console.log("Register: Hashing password")
        const hashedPassword = await hashPassword(password)
        console.log("Register: Password hashed")

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                quota: {
                    create: {
                        maxFileSize: 104857600, // 100MB
                        maxDailyConversions: 50,
                        maxDailyDownloads: 20
                    }
                }
            },
        })
        console.log("Register: User created", user.id)

        return NextResponse.json(
            { message: "User created successfully", user: { id: user.id, email: user.email } },
            { status: 201 }
        )
    } catch (error) {
        console.error("Registration Error:", error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 })
        }
        return NextResponse.json(
            { message: "Something went wrong", error: String(error) },
            { status: 500 }
        )
    }
}

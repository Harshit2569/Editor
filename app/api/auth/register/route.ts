import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { Role } from "@prisma/client"

import { rateLimit } from "@/lib/security/rate-limit"

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: Request) {
  try {
    const rateLimitResponse = rateLimit(req, 5, 60000) // 5 per minute
    if (rateLimitResponse) return rateLimitResponse

    const body = await req.json()
    const { name, email, password } = registerSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
      },
    })

    // Process any pending invitations for this email
    const pendingInvitations = await prisma.invitation.findMany({
      where: { email },
    })

    if (pendingInvitations.length > 0) {
      const documentRoles = pendingInvitations.map((inv: { documentId: string, role: Role }) => ({
        documentId: inv.documentId,
        userId: user.id,
        role: inv.role,
      }))

      // Grant access
      await prisma.documentRole.createMany({
        data: documentRoles,
        skipDuplicates: true,
      })

      // Delete the processed invitations
      await prisma.invitation.deleteMany({
        where: { email },
      })
    }

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid input data", errors: error.issues }, { status: 400 })
    }

    console.error("Registration error:", error)
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 }
    )
  }
}

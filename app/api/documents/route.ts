import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

import { rateLimit } from "@/lib/security/rate-limit"

const createDocSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
})

export async function POST(req: Request) {
  try {
    const rateLimitResponse = rateLimit(req, 30, 60000) // 30 per minute
    if (rateLimitResponse) return rateLimitResponse

    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { title } = createDocSchema.parse(body)

    const document = await prisma.document.create({
      data: {
        title,
        ownerId: session.user.id,
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse("Internal Error", { status: 500 })
  }
}

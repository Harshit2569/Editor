import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

const updateDocSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const { docId } = await params
    const session = await auth()
    const userId = session?.user?.id
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { title } = updateDocSchema.parse(body)

    // Ensure the user has access to this document (owner or collaborator)
    const document = await prisma.document.findUnique({
      where: {
        id: docId,
      },
      include: {
        roles: true,
      }
    })

    if (!document) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const isOwner = document.ownerId === userId
    const isCollaborator = document.roles.some((r: { userId: string }) => r.userId === userId)

    if (!isOwner && !isCollaborator) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const updatedDocument = await prisma.document.update({
      where: {
        id: docId,
      },
      data: {
        title,
      },
    })

    return NextResponse.json(updatedDocument)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse("Internal Error", { status: 500 })
  }
}

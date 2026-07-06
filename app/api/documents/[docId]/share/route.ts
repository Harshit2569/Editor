import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

const shareSchema = z.object({
  email: z.string().email(),
  role: z.enum(["VIEWER", "EDITOR"]),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const { docId } = await params
    const session = await auth()
    
    const currentUserId = session?.user?.id;
    if (!currentUserId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Only owners can share
    const document = await prisma.document.findUnique({
      where: { id: docId },
      select: { ownerId: true }
    })

    if (!document) {
      return new NextResponse("Not Found", { status: 404 })
    }

    if (document.ownerId !== currentUserId) {
      return new NextResponse("Forbidden: Only owners can share", { status: 403 })
    }

    const body = await req.json()
    const { email, role } = shareSchema.parse(body)

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email },
    })

    if (!targetUser) {
      // User doesn't exist, create an invitation instead
      const invitation = await prisma.invitation.upsert({
        where: {
          email_documentId: {
            email,
            documentId: docId,
          }
        },
        update: { role },
        create: {
          email,
          documentId: docId,
          role,
        }
      })
      
      return NextResponse.json({ message: "Invitation created", type: "invitation", data: invitation }, { status: 201 })
    }

    if (targetUser.id === currentUserId) {
      return new NextResponse("Cannot share with yourself", { status: 400 })
    }

    // Upsert role
    const docRole = await prisma.documentRole.upsert({
      where: {
        documentId_userId: {
          documentId: docId,
          userId: targetUser.id,
        }
      },
      update: { role },
      create: {
        documentId: docId,
        userId: targetUser.id,
        role,
      },
      include: {
        user: {
          select: { name: true, email: true, image: true }
        }
      }
    })

    return NextResponse.json(docRole)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const { docId } = await params
    const session = await auth()
    
    const userId = session?.user?.id;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        roles: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } }
          }
        },
        owner: { select: { id: true, name: true, email: true, image: true } }
      }
    })

    if (!document) {
      return new NextResponse("Not Found", { status: 404 })
    }

    // Only owner or people with roles can see the list
    if (document.ownerId !== userId && !document.roles.some((r: { userId: string }) => r.userId === userId)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    return NextResponse.json({
      owner: document.owner,
      roles: document.roles,
    })
  } catch {
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const { docId } = await params
    const session = await auth()
    
    const currentUserId = session?.user?.id;
    if (!currentUserId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Only owners can remove
    const document = await prisma.document.findUnique({
      where: { id: docId },
      select: { ownerId: true }
    })

    if (!document || document.ownerId !== currentUserId) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return new NextResponse("Missing userId", { status: 400 })
    }

    await prisma.documentRole.delete({
      where: {
        documentId_userId: {
          documentId: docId,
          userId,
        }
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch {
    return new NextResponse("Internal Error", { status: 500 })
  }
}

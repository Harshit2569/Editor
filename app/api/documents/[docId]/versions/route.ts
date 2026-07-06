import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

import { rateLimit } from "@/lib/security/rate-limit"

const snapshotSchema = z.object({
  name: z.string().optional(),
  state: z.array(z.number()), // Send the state vector or full Yjs state as an array of bytes
})

// Get all versions for a document
export async function GET(
  req: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const rateLimitResponse = rateLimit(req, 60, 60000) // 60 per minute
    if (rateLimitResponse) return rateLimitResponse

    const { docId } = await params;
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verify access
    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        roles: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!document || (document.ownerId !== session.user.id && document.roles.length === 0)) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const versions = await prisma.docVersion.findMany({
      where: { documentId: docId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        createdAt: true,
        // Exclude the heavy snapshot for the list view
      }
    })

    return NextResponse.json(versions.map((v: any) => ({
      id: v.id,
      name: v.label,
      createdAt: v.createdAt
    })))
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Create a new version snapshot
export async function POST(
  req: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const rateLimitResponse = rateLimit(req, 20, 60000) // 20 per minute
    if (rateLimitResponse) return rateLimitResponse

    const { docId } = await params;
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verify write access (must be owner or have write role)
    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        roles: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!document) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const isOwner = document.ownerId === session.user.id
    const hasWriteRole = document.roles.some((r: any) => r.role === "EDITOR")

    if (!isOwner && !hasWriteRole) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const { name, state } = snapshotSchema.parse(body)
    
    const stateBuffer = Buffer.from(state)
    
    // Safety check: max 10MB per snapshot
    if (stateBuffer.byteLength > 10_485_760) {
      return new NextResponse("Payload Too Large", { status: 413 })
    }

    const version = await prisma.docVersion.create({
      data: {
        documentId: docId,
        label: name || `Version ${new Date().toLocaleString()}`,
        snapshot: stateBuffer,
        createdBy: session.user.id,
      },
      select: {
        id: true,
        label: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      id: version.id,
      name: version.label,
      createdAt: version.createdAt
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse("Internal Error", { status: 500 })
  }
}

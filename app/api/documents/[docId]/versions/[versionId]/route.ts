import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ docId: string; versionId: string }> }
) {
  try {
    const { docId, versionId } = await params;
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

    const version = await prisma.docVersion.findUnique({
      where: { 
        id: versionId,
        documentId: docId, // Ensure the version belongs to this document
      },
    })

    if (!version) {
      return new NextResponse("Version Not Found", { status: 404 })
    }

    // Return the snapshot as a byte array
    return NextResponse.json({
      id: version.id,
      name: version.label,
      createdAt: version.createdAt,
      state: Array.from(version.snapshot)
    })
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}

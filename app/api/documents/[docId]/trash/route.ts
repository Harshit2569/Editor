import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"

export async function POST(
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

    const document = await prisma.document.findUnique({
      where: { id: docId },
    })

    if (!document) {
      return new NextResponse("Not Found", { status: 404 })
    }

    if (document.ownerId !== userId) {
      return new NextResponse("Unauthorized. Only the owner can move this to trash.", { status: 401 })
    }

    const updatedDocument = await prisma.document.update({
      where: { id: docId },
      data: { trashedAt: new Date() },
    })

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error("[DOCUMENT_TRASH_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

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

    const document = await prisma.document.findUnique({
      where: { id: docId },
    })

    if (!document) {
      return new NextResponse("Not Found", { status: 404 })
    }

    if (document.ownerId !== userId) {
      return new NextResponse("Unauthorized. Only the owner can restore this document.", { status: 401 })
    }

    const updatedDocument = await prisma.document.update({
      where: { id: docId },
      data: { trashedAt: null },
    })

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error("[DOCUMENT_RESTORE_PATCH]", error)
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
    const userId = session?.user?.id
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const document = await prisma.document.findUnique({
      where: { id: docId },
    })

    if (!document) {
      return new NextResponse("Not Found", { status: 404 })
    }

    if (document.ownerId !== userId) {
      return new NextResponse("Unauthorized. Only the owner can delete this document.", { status: 401 })
    }

    await prisma.document.delete({
      where: { id: docId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DOCUMENT_PERMANENT_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

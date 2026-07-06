import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { EditorClientWrapper } from "@/components/editor/editor-client-wrapper"

export async function generateMetadata({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    select: { title: true }
  })

  if (!doc) {
    return { title: "Document Not Found" }
  }

  return { title: `${doc.title} | Editor` }
}

export default async function EditorPage({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch document and verify access
  const document = await prisma.document.findUnique({
    where: { id: docId },
    include: {
      roles: {
        where: { userId: session.user.id }
      }
    }
  })

  if (!document) {
    notFound()
  }

  const isOwner = document.ownerId === session.user.id
  const hasRole = document.roles.length > 0
  
  if (!isOwner && !hasRole) {
    // Return 404 instead of 403 to prevent leaking document existence
    notFound()
  }

  return (
    <EditorClientWrapper documentId={document.id} initialTitle={document.title} />
  )
}

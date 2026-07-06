import { Metadata } from "next"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { DocumentCard } from "@/components/dashboard/document-card"
import { Users } from "lucide-react"

export const metadata: Metadata = {
  title: "Shared with me | Editor",
  description: "Documents shared with you",
}

async function getSharedDocuments(userId: string) {
  const documents = await prisma.document.findMany({
    where: {
      trashedAt: null,
      roles: {
        some: { userId }
      }
    },
    include: {
      owner: { select: { name: true, image: true, email: true } },
      roles: { 
        include: { user: { select: { name: true, image: true, email: true } } } 
      }
    },
    orderBy: { updatedAt: "desc" }
  })
  return documents
}

export default async function SharedPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }

  const documents = await getSharedDocuments(session.user.id)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shared with me</h1>
          <p className="text-zinc-400 mt-1">Documents you've been invited to collaborate on</p>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-zinc-800/50 rounded-xl bg-zinc-900/20 backdrop-blur-sm border-dashed">
          <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Nothing shared yet</h3>
          <p className="text-zinc-400 max-w-sm text-center mb-6">
            When someone shares a document with you, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {documents.map((doc: any) => {
            const role = doc.roles.find((r: any) => r.userId === session?.user?.id)?.role || "VIEWER"
              
            return (
              <DocumentCard 
                key={doc.id} 
                document={doc as any} 
                userRole={role} 
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

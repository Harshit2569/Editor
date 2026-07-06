import { Metadata } from "next"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { DocumentCard } from "@/components/dashboard/document-card"
import { FileText } from "lucide-react"
import { CreateDocumentButton } from "@/components/dashboard/create-document-button"

export const metadata: Metadata = {
  title: "Dashboard | Editor",
  description: "Manage your documents",
}

async function getDocuments(userId: string) {
  const documents = await prisma.document.findMany({
    where: {
      AND: [
        { trashedAt: null },
        {
          OR: [
            { ownerId: userId },
            { roles: { some: { userId } } }
          ]
        }
      ]
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

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }

  const documents = await getDocuments(session.user.id)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recent Documents</h1>
          <p className="text-zinc-400 mt-1">Manage and collaborate on your files</p>
        </div>
        {documents.length > 0 && <CreateDocumentButton />}
      </div>

      {documents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-zinc-800/50 rounded-xl bg-zinc-900/20 backdrop-blur-sm border-dashed">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No documents yet</h3>
          <p className="text-zinc-400 max-w-sm text-center mb-6">
            Create your first document to start writing and collaborating with others in real-time.
          </p>
          <CreateDocumentButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {documents.map((doc) => {
            const role = doc.ownerId === session?.user?.id ? "OWNER" : 
              doc.roles.find(r => r.userId === session?.user?.id)?.role || "VIEWER"
              
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

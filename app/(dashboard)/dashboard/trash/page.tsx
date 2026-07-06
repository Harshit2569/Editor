import { Metadata } from "next"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { DocumentCard } from "@/components/dashboard/document-card"

type DocumentType = {
  id: string;
  title: string;
  updatedAt: Date;
  ownerId: string;
  owner: { name: string | null; image: string | null; email: string | null };
  roles: { userId: string; role: string; user: { name: string | null; image: string | null; email: string | null } }[];
};
import { Trash2, AlertCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Trash | Editor",
  description: "Deleted documents",
}

async function getTrashedDocuments(userId: string) {
  const documents = await prisma.document.findMany({
    where: {
      trashedAt: { not: null },
      ownerId: userId // Only owners can see their trashed documents, since only owners can trash them.
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

export default async function TrashPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }

  const documents = await getTrashedDocuments(session.user.id)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-50 flex items-center gap-2">
            <Trash2 className="w-8 h-8 text-red-400" />
            Trash
          </h1>
          <p className="text-zinc-400 mt-1">Manage deleted documents</p>
        </div>
      </div>

      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-red-200">Auto-deletion policy</h3>
          <p className="text-xs text-red-300/80 mt-1">
            Documents in the trash will be permanently deleted after 30 days. You can restore them or delete them permanently before then.
          </p>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-zinc-800/50 rounded-xl bg-zinc-900/20 backdrop-blur-sm border-dashed">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <Trash2 className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Trash is empty</h3>
          <p className="text-zinc-400 max-w-sm text-center mb-6">
            Documents you move to the trash will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {documents.map((doc: DocumentType) => {
            return (
              <DocumentCard 
                key={doc.id} 
                document={doc} 
                userRole="OWNER" 
                isTrashPage={true}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

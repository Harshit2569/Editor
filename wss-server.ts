import "dotenv/config"
import { Server, onAuthenticatePayload } from "@hocuspocus/server"
import { Logger } from "@hocuspocus/extension-logger"
import { Database } from "@hocuspocus/extension-database"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import * as Y from "yjs"

const port = parseInt(process.env.PORT || process.env.WSS_PORT || "1234", 10)

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined.")
}

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// CRITICAL FIX: Prevent Node.js from crashing when Neon drops an idle connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client:', err)
})

// Prisma driver adapter
const adapter = new PrismaPg(pool)

// Prisma Client
const prisma = new PrismaClient({
  adapter,
})

// Initialize Hocuspocus Server
const hocuspocusServer = new Server({
  port,
  extensions: [
    new Logger(),
    new Database({
      fetch: async ({ documentName }: any) => {
        // documentName is the docId
        const doc = await prisma.document.findUnique({
          where: { id: documentName },
        })
        
        if (!doc || !doc.ydocState) {
          return null
        }
        
        return doc.ydocState
      },
      store: async ({ documentName, state, document }: any) => {
        // Must use V1 encoding because Hocuspocus natively applies V1 updates when fetching.
        // Using V2 will silently break the Y.Doc on the server.
        const v1State = Y.encodeStateAsUpdate(document)
        const stateBuffer = Buffer.from(v1State)
        
        if (stateBuffer.byteLength > 10_485_760) {
          console.error(`Document ${documentName} exceeded size limit`)
          return
        }
        
        await prisma.document.update({
          where: { id: documentName },
          data: { ydocState: stateBuffer },
        })
      },
    }),
  ],
  async onChange(data: any) {
    // Validate incoming changes to prevent malicious payloads
    try {
      if (data.update && data.update.byteLength > 1_000_000) {
        throw new Error("Update too large");
      }
    } catch (err) {
      console.error("Malicious or malformed payload detected:", err);
    }
  },
  async onAuthenticate(data: onAuthenticatePayload) {
    try {
      const { token, documentName } = data
      console.log(`[Auth] Attempting auth for doc: ${documentName}, user: ${token}`)
      
      if (!token) {
        console.log(`[Auth] Failed: No token provided`)
        throw new Error("Unauthorized")
      }
      
      const doc = await prisma.document.findUnique({
        where: { id: documentName },
        include: {
          owner: { select: { name: true, email: true, image: true } },
          roles: {
            where: { userId: token },
            include: { user: { select: { name: true, email: true, image: true } } }
          }
        }
      })

      if (!doc) {
        console.log(`[Auth] Failed: Document ${documentName} not found in database`)
        throw new Error("Document not found")
      }

      const isOwner = doc.ownerId === token
      const userRole = doc.roles[0]

      if (!isOwner && !userRole) {
        console.log(`[Auth] Failed: User ${token} has no access to doc ${documentName}`)
        throw new Error("Forbidden: No access to this document")
      }
      
      const userProfile = isOwner ? doc.owner : userRole.user
      console.log(`[Auth] Success for user ${userProfile.name || userProfile.email}`)

      return {
        connection: {
          readOnly: !isOwner && userRole?.role === "VIEWER"
        },
        user: {
          id: token,
          name: userProfile.name || userProfile.email || "Anonymous",
          role: isOwner ? "OWNER" : userRole.role
        }
      }
    } catch (error) {
      console.error("[Auth] Exception during authentication:", error)
      throw error;
    }
  },
})

hocuspocusServer.listen()
console.log(`> WebSocket Server ready on ws://localhost:${port}`)

// ---------------------------------------------------------
// CRON JOB: Keep server awake on free hosting (Render, Railway, etc.)
// ---------------------------------------------------------
// Free tiers often sleep after 15 minutes of inactivity. 
// This pings the server every 14 minutes to keep it alive.
const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; // 14 minutes
const APP_URL = process.env.WSS_PUBLIC_URL || `http://localhost:${port}`;

setInterval(() => {
  try {
    console.log(`[Cron] Pinging ${APP_URL} to keep server awake...`);
    fetch(APP_URL).catch(() => {
      // Ignore fetch errors (e.g. if endpoint isn't fully valid HTTP)
    });
  } catch (error) {
    console.error("[Cron] Ping failed", error);
  }
}, KEEP_ALIVE_INTERVAL);

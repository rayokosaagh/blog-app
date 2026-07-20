import { PrismaClient } from "../../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function makePrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    // Keep TCP sockets alive so the DB is less likely to drop idle connections,
    // and recycle idle clients before the server closes them from its side.
    keepAlive: true,
    idleTimeoutMillis: 30_000,
    max: 10,
  });

  // An idle pooled client can error if the DB closes the socket (server restart,
  // sleep, idle timeout). Without a handler this error is *unhandled* and crashes
  // the process; logging it lets the pool quietly evict the dead client and open
  // a fresh connection on the next query instead of surfacing "Server has closed
  // the connection".
  pool.on("error", (err) => {
    console.error("[prisma] idle pg client error (connection recycled):", err.message);
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
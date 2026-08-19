import { PrismaClient, Prisma } from "../../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Model accessor names as the CURRENT generated client declares them
 * ("HeroAd" -> "heroAd", the same transform Prisma applies).
 */
const MODEL_ACCESSORS = Object.keys(Prisma.ModelName ?? {}).map(
  (name) => name.charAt(0).toLowerCase() + name.slice(1),
);

/**
 * Whether a cached client predates the current generated client.
 *
 * The dev cache below survives HMR, which is the point — otherwise every
 * recompile would open another connection pool. But it also survives
 * `prisma generate`: add a model to schema.prisma, regenerate, and the running
 * server keeps handing out a client built from the OLD datamodel. The new
 * model is simply absent, so the failure is `prisma.newModel` === undefined,
 * i.e. "Cannot read properties of undefined (reading 'findMany')" — which
 * looks nothing like a stale-cache problem and sends you hunting through the
 * schema and the generated output, both of which are perfectly correct.
 *
 * Comparing the cached instance against the freshly-imported model list turns
 * that into a self-healing case: the next recompile rebuilds the client.
 */
function isStale(client: PrismaClient): boolean {
  return MODEL_ACCESSORS.some((accessor) => !(accessor in client));
}

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

const cached = globalForPrisma.prisma;

if (cached && isStale(cached)) {
  console.warn(
    "[prisma] cached client is missing models the generated client declares " +
      "(schema regenerated while the dev server was running) — rebuilding.",
  );
  // Let the old pool go rather than leaking its sockets for the life of the
  // process. Fire-and-forget: nothing is waiting on it, and a failure here
  // must not stop the replacement being created.
  void cached.$disconnect().catch(() => {});
}

export const prisma = cached && !isStale(cached) ? cached : makePrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
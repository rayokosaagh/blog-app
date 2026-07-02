import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create Admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@blog.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@blog.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Create Editor user
  const editorPassword = await bcrypt.hash("editor123", 10);
  const editor = await prisma.user.upsert({
    where: { email: "editor@blog.com" },
    update: {},
    create: {
      name: "Editor User",
      email: "editor@blog.com",
      password: editorPassword,
      role: "EDITOR",
    },
  });

  console.log("✅ Created admin:", admin.email);
  console.log("✅ Created editor:", editor.email);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
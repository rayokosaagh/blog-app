import "dotenv/config";
import { prisma } from "@/lib/prisma"; // match whatever import style your seed.ts uses

async function seedGadgets() {
  const category = await prisma.gadgetCategory.upsert({
    where: { slug: "mobiles" },
    update: {},
    create: { slug: "mobiles", name: "Smartphones", icon: "/icons/smartphone.svg" },
  });

  await prisma.product.upsert({
    where: { slug: "iphone-17-pro-max" },
    update: {},
    create: {
      slug: "iphone-17-pro-max",
      name: "iPhone 17 Pro Max",
      brand: "Apple",
      priceFrom: 250000,
      categoryId: category.id,
      specs: {
        launchDate: "Sept 2025",
        ram: "8GB",
        storage: "256GB/512GB/1TB",
        screenSize: 6.9,
        resolution: "1320x2868",
        batteryMah: 5000,
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: "samsung-galaxy-s26-ultra" },
    update: {},
    create: {
      slug: "samsung-galaxy-s26-ultra",
      name: "Samsung Galaxy S26 Ultra",
      brand: "Samsung",
      priceFrom: 220000,
      categoryId: category.id,
      specs: {
        launchDate: "Jan 2026",
        ram: "12GB",
        storage: "256GB/512GB/1TB",
        screenSize: 6.9,
        resolution: "1440x3120",
        batteryMah: 5500,
      },
    },
  });

  console.log("Gadgets seeded successfully");
}

seedGadgets()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("aunobstore2514", 12);

  const admin = await prisma.admin.upsert({
    where: { email: "aunob2514@gmail.com" },
    update: {},
    create: {
      email: "aunob2514@gmail.com",
      password: hashedPassword,
    },
  });

  console.log(`🌱 Admin account initialized: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
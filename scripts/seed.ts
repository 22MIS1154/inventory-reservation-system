import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const iphone = await prisma.product.create({
    data: {
      name: "iPhone 15",
    },
  });

  const laptop = await prisma.product.create({
    data: {
      name: "MacBook Pro",
    },
  });

  const bangalore = await prisma.warehouse.create({
    data: {
      name: "Bangalore Warehouse",
    },
  });

  const hyderabad = await prisma.warehouse.create({
    data: {
      name: "Hyderabad Warehouse",
    },
  });

  await prisma.inventory.createMany({
    data: [
      {
        productId: iphone.id,
        warehouseId: bangalore.id,
        totalStock: 10,
        reservedStock: 0,
      },
      {
        productId: iphone.id,
        warehouseId: hyderabad.id,
        totalStock: 5,
        reservedStock: 0,
      },
      {
        productId: laptop.id,
        warehouseId: bangalore.id,
        totalStock: 3,
        reservedStock: 0,
      },
    ],
  });

  console.log("Seed data inserted!");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { prisma } from "../loaders/prisma.loader";

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    select: {
      id: true,
      nom: true,
      descripcio: true,
      estat: true
    }
  });
  console.log(JSON.stringify(restaurants, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

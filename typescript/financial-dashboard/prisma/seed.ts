import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function generateUsers() {
  const names =
    "Noah, Oliver, George, Arthur, Muhammad, Leo, Harry, Oscar, Archie, Henry, Theodore, Freddie, Jack, Charlie, Theo, Alfie, Jacob, Thomas, Finley, Arlo, William, Lucas, Roman, Tommy, Isaac, Teddy, Alexander, Luca, Edward, James, Joshua, Albie, Elijah, Max, Mohammed, Reuben, Mason, Sebastian, Rory, Jude, Louie, Benjamin, Ethan, Adam, Hugo, Joseph, Reggie, Ronnie, Harrison, Louis, Olivia, Amelia, Isla, Ava, Ivy, Freya, Lily, Florence, Mia, Willow, Rosie, Sophia, Isabella, Grace, Daisy, Sienna, Poppy, Elsie, Emily, Ella, Evelyn, Phoebe, Sofia, Evie, Charlotte, Harper, Millie, Matilda, Maya, Sophie, Alice, Emilia, Isabelle, Ruby, Luna, Maisie, Aria, Penelope, Mila, Bonnie, Eva, Hallie, Eliza, Ada, Violet, Esme, Arabella, Imogen, Jessica, Delilah"
      .split(", ")
      .map((name) => name.trim());

  await prisma.user.createMany({
    data: names.map((name) => ({
      name,
      email: `${name.toLowerCase()}@example.com`,
      createdAt: randomDateSince(new Date("2020-01-01")),
    })),
  });
}

async function generateProducts() {
  const productNames =
    "NVIDIA GeForce RTX 4090, NVIDIA GeForce RTX 4080, NVIDIA GeForce RTX 4070 Ti, NVIDIA GeForce RTX 4060, NVIDIA GeForce RTX 3090, NVIDIA GeForce RTX 3080 Ti, NVIDIA GeForce RTX 3080, NVIDIA GeForce RTX 3070 Ti, NVIDIA GeForce RTX 3070, NVIDIA GeForce RTX 3060 Ti, NVIDIA GeForce RTX 3060, NVIDIA GeForce RTX 3050, NVIDIA GeForce GTX 1660 Ti, NVIDIA GeForce GTX 1660 Super, NVIDIA GeForce GTX 1660, NVIDIA GeForce GTX 1650 Super, NVIDIA GeForce GTX 1650, NVIDIA GeForce GTX 1050 Ti, NVIDIA GeForce GTX 1050, NVIDIA Quadro RTX 8000, NVIDIA Quadro RTX 6000, NVIDIA Quadro RTX 5000, NVIDIA Tesla V100, NVIDIA Tesla P100, NVIDIA Titan V, NVIDIA Titan RTX, NVIDIA Quadro P4000, NVIDIA Quadro P2000, NVIDIA GRID K2, AMD Radeon RX 7900 XTX, AMD Radeon RX 7900 XT, AMD Radeon RX 7800 XT, AMD Radeon RX 7700 XT, AMD Radeon RX 7600, AMD Radeon RX 6950 XT, AMD Radeon RX 6900 XT, AMD Radeon RX 6800 XT, AMD Radeon RX 6700 XT, AMD Radeon RX 6600 XT, AMD Radeon RX 6500 XT, AMD Radeon RX 6400, AMD Radeon RX 5700 XT, AMD Radeon RX 5700, AMD Radeon VII, AMD Radeon RX 590, AMD Radeon RX 580, AMD Radeon RX 570, AMD Radeon RX 560, AMD Radeon Pro W5700"
      .split(", ")
      .map((name) => name.trim());

  await prisma.product.createMany({
    data: productNames.map((name) => ({
      name,
      price: Math.floor(1000 + Math.random() * 4000),
    })),
  });
}

async function generateOrders() {
  const users = await prisma.user.findMany();
  const products = await prisma.product.findMany();

  for (let i = 0; i < 1000; i++) {
    const user = sample(users);
    const order: { [productId: string]: number } = {};
    for (let j = 0; j < Math.ceil(Math.random() * 5); j++) {
      const product = sample(products);
      order[product.id] = Math.ceil(Math.random() * 10);
    }
    await prisma.order.create({
      data: {
        userId: user.id,
        OrderEntry: {
          createMany: {
            data: Object.entries(order).map(([productId, quantity]) => ({
              productId,
              quantity,
            })),
          },
        },
        createdAt: randomDateSince(user.createdAt),
      },
    });
  }
}

async function main() {
  await generateUsers();
  await generateProducts();
  await generateOrders();
}

const sample = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];

const randomDateSince = (since: Date) =>
  new Date(since.getTime() + Math.random() * (Date.now() - since.getTime()));

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

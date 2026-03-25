import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const currency = "USD";

const stores = [
  { id: "store_alpha", name: "Northwind Outfitters", slug: "northwind-outfitters" },
  { id: "store_luna", name: "Luna Home", slug: "luna-home" }
];

const products = [
  { id: "prod_alpha_hoodie", storeId: "store_alpha", name: "Trail Hoodie", price: 68 },
  { id: "prod_alpha_boots", storeId: "store_alpha", name: "Summit Boots", price: 124 },
  { id: "prod_alpha_pack", storeId: "store_alpha", name: "Ridge Pack", price: 88 },
  { id: "prod_alpha_bottle", storeId: "store_alpha", name: "Steel Bottle", price: 28 },
  { id: "prod_alpha_cap", storeId: "store_alpha", name: "Field Cap", price: 24 },
  { id: "prod_luna_vase", storeId: "store_luna", name: "Bloom Vase", price: 56 },
  { id: "prod_luna_throw", storeId: "store_luna", name: "Cloud Throw", price: 72 },
  { id: "prod_luna_lamp", storeId: "store_luna", name: "Halo Lamp", price: 118 },
  { id: "prod_luna_mug", storeId: "store_luna", name: "Stone Mug Set", price: 32 },
  { id: "prod_luna_planter", storeId: "store_luna", name: "Terra Planter", price: 48 }
];

type EventInput = {
  eventId: string;
  storeId: string;
  eventType: string;
  timestamp: Date;
  productId?: string;
  amount?: number;
  currency?: string;
  metadata?: Prisma.InputJsonValue;
};

type DailyStats = {
  revenue: number;
  pageViews: number;
  addToCart: number;
  removeFromCart: number;
  checkoutStarted: number;
  purchases: number;
};

type ProductStats = {
  revenue: number;
  purchases: number;
};

function startOfUtcDay(input: Date): Date {
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAtDay(day: Date): Date {
  const hour = randomInt(0, 23);
  const minute = randomInt(0, 59);
  const second = randomInt(0, 59);

  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, minute, second));
}

function pickProduct(storeId: string) {
  const storeProducts = products.filter((product) => product.storeId === storeId);
  return storeProducts[randomInt(0, storeProducts.length - 1)];
}

function incrementDailyStats(map: Map<string, DailyStats>, storeId: string, day: Date, eventType: string, amount?: number) {
  const key = `${storeId}|${day.toISOString()}`;
  const current = map.get(key) ?? {
    revenue: 0,
    pageViews: 0,
    addToCart: 0,
    removeFromCart: 0,
    checkoutStarted: 0,
    purchases: 0
  };

  if (eventType === "page_view") current.pageViews += 1;
  if (eventType === "add_to_cart") current.addToCart += 1;
  if (eventType === "remove_from_cart") current.removeFromCart += 1;
  if (eventType === "checkout_started") current.checkoutStarted += 1;
  if (eventType === "purchase") {
    current.purchases += 1;
    current.revenue += amount ?? 0;
  }

  map.set(key, current);
}

function incrementProductStats(
  map: Map<string, ProductStats>,
  storeId: string,
  day: Date,
  productId: string,
  amount: number
) {
  const key = `${storeId}|${day.toISOString()}|${productId}`;
  const current = map.get(key) ?? {
    revenue: 0,
    purchases: 0
  };

  current.revenue += amount;
  current.purchases += 1;
  map.set(key, current);
}

async function main() {
  const events: EventInput[] = [];
  const dailyStats = new Map<string, DailyStats>();
  const productStats = new Map<string, ProductStats>();

  const today = startOfUtcDay(new Date());

  for (const store of stores) {
    for (let offset = 29; offset >= 0; offset -= 1) {
      const day = new Date(today);
      day.setUTCDate(today.getUTCDate() - offset);

      const weekdayBoost = day.getUTCDay() === 0 || day.getUTCDay() === 6 ? 0.85 : 1;
      const baseViews = Math.round(randomInt(90, 220) * weekdayBoost);
      const addToCarts = Math.round(baseViews * (0.14 + Math.random() * 0.08));
      const removals = Math.round(addToCarts * (0.18 + Math.random() * 0.08));
      const checkouts = Math.round(addToCarts * (0.5 + Math.random() * 0.15));
      const purchases = Math.max(1, Math.round(checkouts * (0.45 + Math.random() * 0.15)));

      for (let index = 0; index < baseViews; index += 1) {
        events.push({
          eventId: `evt_${store.id}_${offset}_view_${index}`,
          storeId: store.id,
          eventType: "page_view",
          timestamp: randomAtDay(day),
          currency,
          metadata: { source: "seed", sessionId: `sess_${store.id}_${offset}_${index}` }
        });
        incrementDailyStats(dailyStats, store.id, day, "page_view");
      }

      for (let index = 0; index < addToCarts; index += 1) {
        const product = pickProduct(store.id);
        events.push({
          eventId: `evt_${store.id}_${offset}_cart_${index}`,
          storeId: store.id,
          eventType: "add_to_cart",
          timestamp: randomAtDay(day),
          productId: product.id,
          amount: product.price,
          currency,
          metadata: { source: "seed", productName: product.name }
        });
        incrementDailyStats(dailyStats, store.id, day, "add_to_cart");
      }

      for (let index = 0; index < removals; index += 1) {
        const product = pickProduct(store.id);
        events.push({
          eventId: `evt_${store.id}_${offset}_remove_${index}`,
          storeId: store.id,
          eventType: "remove_from_cart",
          timestamp: randomAtDay(day),
          productId: product.id,
          amount: product.price,
          currency,
          metadata: { source: "seed", productName: product.name }
        });
        incrementDailyStats(dailyStats, store.id, day, "remove_from_cart");
      }

      for (let index = 0; index < checkouts; index += 1) {
        const product = pickProduct(store.id);
        events.push({
          eventId: `evt_${store.id}_${offset}_checkout_${index}`,
          storeId: store.id,
          eventType: "checkout_started",
          timestamp: randomAtDay(day),
          productId: product.id,
          amount: product.price,
          currency,
          metadata: { source: "seed", productName: product.name }
        });
        incrementDailyStats(dailyStats, store.id, day, "checkout_started");
      }

      for (let index = 0; index < purchases; index += 1) {
        const product = pickProduct(store.id);
        const amount = product.price;
        events.push({
          eventId: `evt_${store.id}_${offset}_purchase_${index}`,
          storeId: store.id,
          eventType: "purchase",
          timestamp: randomAtDay(day),
          productId: product.id,
          amount,
          currency,
          metadata: { source: "seed", productName: product.name }
        });
        incrementDailyStats(dailyStats, store.id, day, "purchase", amount);
        incrementProductStats(productStats, store.id, day, product.id, amount);
      }
    }
  }

  await prisma.event.deleteMany();
  await prisma.productDailyStats.deleteMany();
  await prisma.storeDailyStats.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();

  await prisma.store.createMany({ data: stores });
  await prisma.product.createMany({ data: products });
  await prisma.event.createMany({
    data: events.map((event) => ({
      eventId: event.eventId,
      storeId: event.storeId,
      eventType: event.eventType,
      timestamp: event.timestamp,
      productId: event.productId,
      amount: event.amount,
      currency: event.currency,
      metadata: event.metadata
    }))
  });

  await prisma.storeDailyStats.createMany({
    data: Array.from(dailyStats.entries()).map(([key, stats]) => {
      const [storeId, date] = key.split("|");
      return {
        storeId,
        date: new Date(date),
        revenue: Number(stats.revenue.toFixed(2)),
        pageViews: stats.pageViews,
        addToCart: stats.addToCart,
        removeFromCart: stats.removeFromCart,
        checkoutStarted: stats.checkoutStarted,
        purchases: stats.purchases
      };
    })
  });

  await prisma.productDailyStats.createMany({
    data: Array.from(productStats.entries()).map(([key, stats]) => {
      const [storeId, date, productId] = key.split("|");
      return {
        storeId,
        date: new Date(date),
        productId,
        revenue: Number(stats.revenue.toFixed(2)),
        purchases: stats.purchases
      };
    })
  });

  console.log(`Seeded ${stores.length} stores, ${products.length} products, and ${events.length} events.`);
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

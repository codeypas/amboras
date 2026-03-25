import { Prisma } from "@prisma/client";
import { Injectable, NotFoundException } from "@nestjs/common";
import { CacheService } from "../common/cache.service";
import { startOfUtcDay } from "../common/date.utils";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEventDto } from "./dto/create-event.dto";

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService
  ) {}

  async ingestEvent(dto: CreateEventDto) {
    const eventDate = new Date(dto.timestamp);
    const dayBucket = startOfUtcDay(eventDate);
    const amount = dto.data?.amount ?? 0;

    const store = await this.prisma.store.findUnique({
      where: {
        id: dto.storeId
      }
    });

    if (!store) {
      throw new NotFoundException("Store not found");
    }

    const event = await this.prisma.$transaction(async (tx) => {
      const createdEvent = await tx.event.create({
        data: {
          eventId: dto.eventId,
          storeId: dto.storeId,
          eventType: dto.eventType,
          timestamp: eventDate,
          productId: dto.data?.productId,
          amount: dto.data?.amount,
          currency: dto.data?.currency,
          metadata: dto.data ? (dto.data as Prisma.InputJsonValue) : undefined
        }
      });

      const statsUpdate: {
        revenue?: { increment: number };
        pageViews?: { increment: number };
        addToCart?: { increment: number };
        removeFromCart?: { increment: number };
        checkoutStarted?: { increment: number };
        purchases?: { increment: number };
      } = {};

      if (dto.eventType === "page_view") statsUpdate.pageViews = { increment: 1 };
      if (dto.eventType === "add_to_cart") statsUpdate.addToCart = { increment: 1 };
      if (dto.eventType === "remove_from_cart") statsUpdate.removeFromCart = { increment: 1 };
      if (dto.eventType === "checkout_started") statsUpdate.checkoutStarted = { increment: 1 };
      if (dto.eventType === "purchase") {
        statsUpdate.revenue = { increment: amount };
        statsUpdate.purchases = { increment: 1 };
      }

      await tx.storeDailyStats.upsert({
        where: {
          storeId_date: {
            storeId: dto.storeId,
            date: dayBucket
          }
        },
        update: statsUpdate,
        create: {
          storeId: dto.storeId,
          date: dayBucket,
          revenue: dto.eventType === "purchase" ? amount : 0,
          pageViews: dto.eventType === "page_view" ? 1 : 0,
          addToCart: dto.eventType === "add_to_cart" ? 1 : 0,
          removeFromCart: dto.eventType === "remove_from_cart" ? 1 : 0,
          checkoutStarted: dto.eventType === "checkout_started" ? 1 : 0,
          purchases: dto.eventType === "purchase" ? 1 : 0
        }
      });

      if (dto.eventType === "purchase" && dto.data?.productId) {
        await tx.productDailyStats.upsert({
          where: {
            storeId_date_productId: {
              storeId: dto.storeId,
              date: dayBucket,
              productId: dto.data.productId
            }
          },
          update: {
            revenue: {
              increment: amount
            },
            purchases: {
              increment: 1
            }
          },
          create: {
            storeId: dto.storeId,
            date: dayBucket,
            productId: dto.data.productId,
            revenue: amount,
            purchases: 1
          }
        });
      }

      return createdEvent;
    });

    for (const trendDays of [7, 14, 30]) {
      await this.cacheService.del(`analytics:overview:${dto.storeId}:trend:${trendDays}`);
    }
    await this.cacheService.del(`analytics:top-products:${dto.storeId}`);

    return event;
  }
}

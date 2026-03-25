import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

type MemoryValue = {
  value: string;
  expiresAt: number;
};

@Injectable()
export class CacheService implements OnModuleDestroy {
  private redisClient: Redis | null = null;
  private readonly memoryCache = new Map<string, MemoryValue>();

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>("REDIS_URL");

    if (!redisUrl) {
      return;
    }

    this.redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false
    });

    this.redisClient.connect().catch(() => {
      this.redisClient = null;
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redisClient) {
      try {
        const value = await this.redisClient.get(key);
        return value ? (JSON.parse(value) as T) : null;
      } catch {
        this.redisClient = null;
      }
    }

    const value = this.memoryCache.get(key);
    if (!value) {
      return null;
    }

    if (Date.now() >= value.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return JSON.parse(value.value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.redisClient) {
      try {
        await this.redisClient.set(key, serialized, "EX", ttlSeconds);
        return;
      } catch {
        this.redisClient = null;
      }
    }

    this.memoryCache.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  async del(key: string): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch {
        this.redisClient = null;
      }
    }

    this.memoryCache.delete(key);
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { createClient, RedisClientType } from "redis";

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly client: RedisClientType;
  private connectPromise: Promise<void> | null = null;

  constructor() {
    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST ?? "127.0.0.1",
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    });

    this.client.on("error", (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown Redis error";
      console.error(message);
    });
  }

  private async ensureConnected(): Promise<void> {
    if (this.client.isOpen) {
      return;
    }

    if (!this.connectPromise) {
      this.connectPromise = this.client.connect().then(() => undefined);
    }

    await this.connectPromise;
    this.connectPromise = null;
  }

  async set(key: string, value: string, ttlMs: number): Promise<void> {
    await this.ensureConnected();
    await this.client.setEx(key, Math.max(1, Math.ceil(ttlMs / 1000)), value);
  }

  async get<T = string>(key: string): Promise<T | null> {
    await this.ensureConnected();
    return (await this.client.get(key)) as T | null;
  }

  async del(key: string): Promise<void> {
    await this.ensureConnected();
    await this.client.del(key);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }
}
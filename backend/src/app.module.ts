import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AnalyticsModule } from "./analytics/analytics.module";
import { AuthModule } from "./auth/auth.module";
import { CommonModule } from "./common/common.module";
import { EventsModule } from "./events/events.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    PrismaModule,
    CommonModule,
    AuthModule,
    EventsModule,
    AnalyticsModule
  ]
})
export class AppModule {}

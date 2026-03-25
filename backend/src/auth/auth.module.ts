import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStoreGuard } from "./jwt-store.guard";

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET") ?? "amboras-dev-secret",
        signOptions: {
          expiresIn: "12h"
        }
      })
    })
  ],
  providers: [AuthService, JwtStoreGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtStoreGuard]
})
export class AuthModule {}

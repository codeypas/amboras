import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";

type StoreJwtPayload = {
  sub: string;
  storeId: string;
  storeName: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async listDemoStores() {
    return this.prisma.store.findMany({
      orderBy: {
        name: "asc"
      }
    });
  }

  async login(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: {
        id: storeId
      }
    });

    if (!store) {
      throw new UnauthorizedException("Unknown store");
    }

    const payload: StoreJwtPayload = {
      sub: `demo-owner:${store.id}`,
      storeId: store.id,
      storeName: store.name
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      store
    };
  }

  async verifyAccessToken(token: string): Promise<StoreJwtPayload> {
    try {
      return await this.jwtService.verifyAsync<StoreJwtPayload>(token);
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}

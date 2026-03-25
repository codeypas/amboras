import { Body, Controller, Get, Post } from "@nestjs/common";
import { DemoLoginDto } from "./dto/demo-login.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("demo-stores")
  async getDemoStores() {
    return this.authService.listDemoStores();
  }

  @Post("demo-login")
  async demoLogin(@Body() body: DemoLoginDto) {
    return this.authService.login(body.storeId);
  }
}

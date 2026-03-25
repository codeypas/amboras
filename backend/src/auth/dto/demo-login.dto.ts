import { IsNotEmpty, IsString } from "class-validator";

export class DemoLoginDto {
  @IsString()
  @IsNotEmpty()
  storeId!: string;
}

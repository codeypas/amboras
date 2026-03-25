import { Transform, Type } from "class-transformer";
import {
  IsISO8601,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from "class-validator";
import { EVENT_TYPES } from "../../common/event-types";

export class CreateEventDataDto {
  @IsOptional()
  @IsString()
  @Transform(({ value, obj }) => obj.product_id ?? value)
  productId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value, obj }) => obj.event_id ?? value)
  eventId!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value, obj }) => obj.store_id ?? value)
  storeId!: string;

  @IsString()
  @IsIn(EVENT_TYPES)
  @Transform(({ value, obj }) => obj.event_type ?? value)
  eventType!: string;

  @IsISO8601()
  timestamp!: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateEventDataDto)
  data?: CreateEventDataDto;
}

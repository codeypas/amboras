import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class AnalyticsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(30)
  trendDays?: number;
}

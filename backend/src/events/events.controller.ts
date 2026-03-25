import { Body, Controller, Headers, Post, UnauthorizedException } from "@nestjs/common";
import { CreateEventDto } from "./dto/create-event.dto";
import { EventsService } from "./events.service";

@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  async ingestEvent(
    @Body() body: CreateEventDto,
    @Headers("x-ingestion-key") ingestionKey?: string
  ) {
    const expectedKey = process.env.INGESTION_API_KEY ?? "amboras-ingest-key";

    if (ingestionKey !== expectedKey) {
      throw new UnauthorizedException("Invalid ingestion key");
    }

    return this.eventsService.ingestEvent(body);
  }
}

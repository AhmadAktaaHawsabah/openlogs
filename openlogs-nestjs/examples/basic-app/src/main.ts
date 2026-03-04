import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  Module,
  Controller,
  Get,
  InternalServerErrorException,
} from "@nestjs/common";
import { OpenLogsModule, OpenLogsService } from "@nextera.one/openlogs-nestjs";

@Controller()
export class AppController {
  constructor(private readonly openlogsService: OpenLogsService) {}

  @Get()
  getHello(): string {
    return "Hello OpenLogs API!";
  }

  @Get("error")
  getError(): string {
    throw new InternalServerErrorException("Something went wrong!");
  }

  @Get("chain")
  getChain() {
    return this.openlogsService.getChain();
  }
}

@Module({
  imports: [
    OpenLogsModule.forRoot({
      nodeName: "demo-api",
      context: { env: "demo" },
      location: {
        latitude: 25.2048,
        longitude: 55.2708,
        placeCountryCode: "AE",
      },
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["debug", "error", "log", "warn"],
  });
  await app.listen(3000);
  console.log(`Application is running on: http://localhost:3000`);
}
bootstrap();

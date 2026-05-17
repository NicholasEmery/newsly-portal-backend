import { Module } from "@nestjs/common";
import { SystemService } from "./system.service";
import { SystemController } from "./system.controller";
import { PrismaModule } from "../../database/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [SystemService],
  controllers: [SystemController],
})
export class SystemModule {}

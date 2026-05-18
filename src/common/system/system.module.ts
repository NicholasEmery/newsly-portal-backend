import { Module } from "@nestjs/common";
import { SystemController } from "./system.controller";
import { SystemService } from "./system.service";
import { PrismaModule } from "../../database/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [SystemService],
  controllers: [SystemController],
})
export class SystemModule {}

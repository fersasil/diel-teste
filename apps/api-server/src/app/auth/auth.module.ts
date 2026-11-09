import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { FocusClientModule } from "./services/focus-client/focus-client.module";
import { LoginModule } from "./services/login/login.module";
import { ReadSessionModule } from "./services/read-session/read-session.module";

@Module({
  imports: [LoginModule, ReadSessionModule, FocusClientModule],
  controllers: [AuthController],
})
export class AuthModule {}

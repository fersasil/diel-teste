import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../infra/database/database.module";
import { CityWeatherSync } from "./services/run-city-weather/city-weather.sync";

@Module({
  imports: [DatabaseModule],
  providers: [CityWeatherSync],
  exports: [CityWeatherSync],
})
export class WeatherModule {}

import { Module } from "@nestjs/common";
import { OpenMeteoClient } from "../../infra/open-meteo/open-meteo.client";
import { WeatherRepository } from "./repositories/weather.repository";
import { RunCityWeatherService } from "./services/run-city-weather/run-city-weather.service";

@Module({
  providers: [WeatherRepository, OpenMeteoClient, RunCityWeatherService],
  exports: [RunCityWeatherService],
})
export class WeatherModule {}

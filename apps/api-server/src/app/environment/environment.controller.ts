import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthenticateRequestGuard } from "../auth/services/authenticate-request/authenticate-request.service";
import { scopeClientId, type AccessScope } from "../auth/services/access-scope/access-scope.service";
import { EnvironmentRepository } from "./repositories/environment.repository";
import { ExternalWeatherRepository } from "./repositories/external-weather.repository";
import { summarize } from "./services/get-environment-summary/get-environment-summary.service";
import { GetTimeseriesService } from "./services/get-timeseries/get-timeseries.service";
import { alignExternalWeather } from "./services/align-external-weather/align-external-weather.service";
import { attachExternalWeather } from "./services/attach-external-weather/attach-external-weather.service";
import { ListEnvironmentOptionsService } from "./services/list-environment-options/list-environment-options.service";
import { ListEnvironmentsService } from "./services/list-environments/list-environments.service";
import { daySpan, parseDay, rangeEnd } from "../../shared/time/local-day";
import { parsePeriod, periodRange } from "../../shared/time/parse-period";
import { validateRange } from "./services/timeseries-bucket/timeseries-bucket.service";
import { readVirtualNow } from "../../infra/redis/read-virtual-clock";

@Controller("environments")
@UseGuards(AuthenticateRequestGuard)
export class EnvironmentController {
  private readonly environments = new EnvironmentRepository();
  private readonly weather = new ExternalWeatherRepository();

  constructor(
    private readonly timeseries: GetTimeseriesService,
    private readonly listEnvironments: ListEnvironmentsService,
    private readonly listOptions: ListEnvironmentOptionsService,
  ) {}

  @Get()
  async list(
    @Req() request: { access: AccessScope },
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("storeId") storeId?: string,
    @Query("environmentName") environmentName?: string,
    @Query("comfortStatus") comfortStatus?: string,
    @Query("deviceStatus") deviceStatus?: string,
    @Query("sort") sort?: string,
    @Query("dir") dir?: string,
    @Query("period") period?: string,
  ) {
    return this.listEnvironments.execute(
      request.access,
      { page, pageSize, storeId, environmentName, comfortStatus, deviceStatus, sort, dir, period },
      await readVirtualNow(),
    );
  }

  @Get("options")
  async options(
    @Req() request: { access: AccessScope },
    @Query("storeId") storeId?: string,
    @Query("q") q?: string,
    @Query("storeQ") storeQ?: string,
    @Query("limit") limit?: string,
    @Query("selectedName") selectedName?: string,
  ) {
    return this.listOptions.execute(request.access, { storeId, q, storeQ, limit, selectedName });
  }

  @Get(":id/summary")
  async summary(
    @Req() request: { access: AccessScope },
    @Param("id") id: string,
    @Query("period") period?: string,
    @Query("date") date?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const environment = await this.scoped(request.access, id);
    const clock = await readVirtualNow();
    const range = windowOf(environment, clock, { period, date, from, to });

    if (range === "INVALID_RANGE") {
      throw new BadRequestException({ code: "INVALID_RANGE" });
    }

    const counts = await this.environments.operatingCounts(id, range.from, range.to);
    return {
      ...summarize(
        environment,
        clock,
        counts.operatingSeconds,
        counts.inRangeSeconds,
      ),
      latestAt: environment.lastSeenAt?.toISOString() ?? null,
      asOf: clock.toISOString(),
      windowFrom: range.from.toISOString(),
      windowTo: range.to.toISOString(),
    };
  }

  @Get(":id/timeseries")
  async series(
    @Req() request: { access: AccessScope },
    @Param("id") id: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("bucket") bucket?: string,
    @Query("period") period?: string,
    @Query("date") date?: string,
  ) {
    const environment = await this.scoped(request.access, id);
    const clock = await readVirtualNow();
    const dated = parseDay(from) && parseDay(to);
    const range = dated || !from || !to
      ? windowOf(environment, clock, { period, date, from, to })
      : { from: new Date(from), to: new Date(to) };

    if (range === "INVALID_RANGE") {
      throw new BadRequestException({ code: "INVALID_RANGE" });
    }

    const fromIso = range.from.toISOString();
    const toIso = range.to.toISOString();
    const series = await this.timeseries.execute({
      environmentId: id,
      from: fromIso,
      to: toIso,
      bucket,
      timezone: environment.timezone,
    });

    if ("code" in series) {
      throw new BadRequestException({ code: series.code });
    }

    const hourly = await this.weather.series(environment.storeId, new Date(fromIso), new Date(toIso));
    const external = alignExternalWeather(series.points, hourly, series.bucket);
    return attachExternalWeather(
      {
        comfortMin: environment.comfortMin,
        comfortMax: environment.comfortMax,
        bucket: series.bucket,
        points: series.points,
      },
      external,
    );
  }

  private async scoped(scope: AccessScope, id: string) {
    const clientId = scopeClientId(scope);

    if (!clientId) {
      throw new NotFoundException({ code: "NOT_FOUND" });
    }

    const environment = await this.environments.findScoped(id, clientId);

    if (!environment) {
      throw new NotFoundException({ code: "NOT_FOUND" });
    }

    if (scope.profile === "store_manager" && !scope.allowedStoreIds.includes(environment.storeId)) {
      throw new NotFoundException({ code: "NOT_FOUND" });
    }

    return environment;
  }
}

function windowOf(
  environment: { timezone: string; lastSeenAt: Date | null },
  virtualNow: Date,
  query: { period?: string; date?: string; from?: string; to?: string },
): { from: Date; to: Date } | "INVALID_RANGE" {
  const fromDay = parseDay(query.from);
  const toDay = parseDay(query.to);

  if (fromDay && toDay) {
    const span = daySpan(fromDay, toDay, environment.timezone);

    if (!span || validateRange(span.from, span.to) !== "OK") {
      return "INVALID_RANGE";
    }

    return span;
  }

  return periodRange(parsePeriod(query.period), anchor(environment, virtualNow, query.date));
}

function anchor(
  environment: { timezone: string; lastSeenAt: Date | null },
  virtualNow: Date,
  date?: string,
): Date {
  return rangeEnd({
    day: parseDay(date),
    timeZone: environment.timezone,
    virtualNow,
  });
}

import { Injectable } from "@nestjs/common";
import { TimeseriesRepository } from "../../repositories/timeseries.repository";
import { resolveBucket, validateRange } from "../timeseries-bucket/timeseries-bucket.service";
import type { TimeseriesQuery, TimeseriesResult } from "./get-timeseries.interface";

@Injectable()
export class GetTimeseriesService {
  private readonly series = new TimeseriesRepository();

  async execute(input: TimeseriesQuery): Promise<TimeseriesResult> {
    const bucket = resolveBucket(input.bucket);

    if (bucket === "INVALID_BUCKET") {
      return { code: "INVALID_BUCKET" };
    }

    const from = new Date(input.from);
    const to = new Date(input.to);

    if (validateRange(from, to) === "INVALID_RANGE") {
      return { code: "INVALID_RANGE" };
    }

    const points = await this.series.series({
      environmentId: input.environmentId,
      from,
      to,
      bucket,
      timezone: input.timezone,
    });
    return { bucket, points };
  }
}

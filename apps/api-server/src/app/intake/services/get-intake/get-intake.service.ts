import { Injectable } from "@nestjs/common";
import type { AccessScope } from "../../../auth/services/access-scope/access-scope.service";
import { IntakeRepository } from "../../repositories/intake.repository";
import type { IntakeView } from "./get-intake.interface";
import { decideIntakeAccess } from "./get-intake.rules";
import { trafficBytes } from "./traffic-bytes";

const DEVICE_LIMIT = 50;

@Injectable()
export class GetIntakeService {
  private readonly intake = new IntakeRepository();

  async execute(scope: AccessScope): Promise<IntakeView> {
    if (decideIntakeAccess(scope) === "FORBIDDEN") {
      return {
        packets: 0,
        acceptedReadings: 0,
        unknownReadings: 0,
        outOfRangeReadings: 0,
        unknownDevices: [],
        devices: [],
        code: "FORBIDDEN",
      };
    }

    const [counts, unknownDevices, devices] = await Promise.all([
      this.intake.summary(),
      this.intake.unknownDevices(DEVICE_LIMIT),
      this.intake.devices(),
    ]);
    return {
      ...counts,
      unknownDevices: unknownDevices.map((device) => ({
        deviceId: device.deviceId,
        readings: device.readings,
        lastAt: device.lastAt.toISOString(),
        lastValue: device.lastValue,
      })),
      devices: devices.map((device) => {
        const volume = trafficBytes(device.readings, device.recentReadings);
        return {
          deviceId: device.deviceId,
          environmentName: device.environmentName,
          storeName: device.storeName,
          totalBytes: volume.totalBytes,
          bytesPerHour: volume.bytesPerHour,
        };
      }),
    };
  }
}

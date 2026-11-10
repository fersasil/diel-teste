import { Injectable } from "@nestjs/common";
import { RedisStore } from "../../../../infra/redis/redis";

const KEY = "system:virtual_now";

// The clock only moves forward. An older packet must not pull the screen back in time.
const ADVANCE = `
local current = redis.call("GET", KEYS[1])
if current and current >= ARGV[1] then
  return current
end
redis.call("SET", KEYS[1], ARGV[1])
return ARGV[1]
`;

@Injectable()
export class VirtualClockService {
  public constructor(private readonly redis: RedisStore) {}

  public async execute(sampleTime: Date): Promise<string> {
    const store = await this.redis.get();
    const next = sampleTime.toISOString();
    const saved = await store.eval(ADVANCE, { keys: [KEY], arguments: [next] });
    return String(saved);
  }
}

export function shouldAck(objectStored: boolean, samplesCommitted: boolean): boolean {
  return objectStored && samplesCommitted;
}

export function shouldMqttAck(enqueued: boolean): boolean {
  return enqueued;
}

export function shouldDeadLetter(fails: number, maxFails = 5): boolean {
  return fails > maxFails;
}

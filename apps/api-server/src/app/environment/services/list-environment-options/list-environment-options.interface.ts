export interface EnvironmentOptions {
  stores: Array<{ id: string; name: string }>;
  environmentNames: string[];
  code?: "CLIENT_FOCUS_REQUIRED";
}

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["reflect-metadata"],
  testMatch: ["**/src/**/*.spec.ts", "**/src/**/*.test.ts", "**/test/e2e/**/*.e2e.ts"],
};

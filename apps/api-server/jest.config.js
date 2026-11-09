module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/src/**/*.spec.ts", "**/src/**/*.test.ts", "**/test/e2e/**/*.e2e.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};

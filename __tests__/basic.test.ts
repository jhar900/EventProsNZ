describe("Basic Test Suite", () => {
  it("should pass basic math test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle environment variables", () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "test-token";
    expect(process.env.NEXT_PUBLIC_MAPBOX_TOKEN).toBe("test-token");
  });

  it("should handle async operations", async () => {
    const result = await Promise.resolve("test");
    expect(result).toBe("test");
  });
});

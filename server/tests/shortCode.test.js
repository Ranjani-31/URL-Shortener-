// tests/shortCode.test.js
const generateShortCode = require("../utils/generateShortCode");

describe("generateShortCode Utility", () => {
  test("generates a short code of default length 8", () => {
    const code = generateShortCode();
    expect(typeof code).toBe("string");
    expect(code).toHaveLength(8);
  });

  test("contains only URL-safe alphanumeric characters", () => {
    const code = generateShortCode();
    expect(code).toMatch(/^[a-zA-Z0-9_-]+$/);
  });

  test("generates unique codes across consecutive calls", () => {
    const code1 = generateShortCode();
    const code2 = generateShortCode();
    expect(code1).not.toBe(code2);
  });
});
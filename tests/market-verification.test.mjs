import test from "node:test";
import assert from "node:assert/strict";
import { calculateMarketProbability, validateMarketForTrading } from "../frontend/soroban.js";

test("calculateMarketProbability returns fallback when pools are empty", () => {
  assert.strictEqual(calculateMarketProbability(0, 0), 50);
  assert.strictEqual(calculateMarketProbability(0n, 0n), 50);
  assert.strictEqual(calculateMarketProbability(null, null, 45), 45);
});

test("calculateMarketProbability calculates ratio accurately from BigInt stroops", () => {
  // Equal pools = 50%
  assert.strictEqual(calculateMarketProbability(100_000_000n, 100_000_000n), 50);

  // 98 XLM yes, 50 XLM no -> 98 / 148 = 66%
  const prob = calculateMarketProbability(98_000_000n, 50_000_000n);
  assert.strictEqual(prob, 66);

  // Clamping at extremes [1, 99]
  assert.strictEqual(calculateMarketProbability(10_000_000_000n, 1n), 99);
  assert.strictEqual(calculateMarketProbability(1n, 10_000_000_000n), 1);
});

test("validateMarketForTrading approves active open market", () => {
  const activeMarket = {
    question: "Will Stellar reach 70M ledgers?",
    cancelled: false,
    resolved: false,
    end_time: 2000000000,
  };
  assert.strictEqual(validateMarketForTrading(activeMarket, 1700000000), true);
});

test("validateMarketForTrading rejects null or undefined market", () => {
  assert.throws(
    () => validateMarketForTrading(null),
    /Market data could not be retrieved/
  );
});

test("validateMarketForTrading rejects cancelled market", () => {
  assert.throws(
    () => validateMarketForTrading({ cancelled: true }),
    /cancelled by the administrator/
  );
});

test("validateMarketForTrading rejects resolved market", () => {
  assert.throws(
    () => validateMarketForTrading({ resolved: true }),
    /already been resolved/
  );
});

test("validateMarketForTrading rejects expired market", () => {
  assert.throws(
    () => validateMarketForTrading({ end_time: 1500000000 }, 1600000000),
    /market has ended and is awaiting resolution/
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { formatTokenAmount, getContracts } from "../frontend/soroban.js";

test("formatTokenAmount formats token stroops with contract decimals", () => {
  assert.strictEqual(formatTokenAmount(0), "0");
  assert.strictEqual(formatTokenAmount(0n), "0");
  assert.strictEqual(formatTokenAmount(null), "0");
  assert.strictEqual(formatTokenAmount(undefined), "0");

  // Standard 7-decimal Soroban SEP-41 token amounts
  assert.strictEqual(formatTokenAmount(110_000_000n, 7), "11");
  assert.strictEqual(formatTokenAmount(20_000_000n, 7), "2");
  assert.strictEqual(formatTokenAmount(1_500_000n, 7), "0.15");
  assert.strictEqual(formatTokenAmount(1n, 7), "0.0000001");
  assert.strictEqual(formatTokenAmount("1234567890", 7), "123.456789");
});

test("contracts.json contains valid contract definitions", () => {
  const contractsPath = resolve("frontend/contracts.json");
  const raw = readFileSync(contractsPath, "utf8");
  const json = JSON.parse(raw);

  assert.strictEqual(json.network, "testnet");
  assert.ok(json.contracts.token);
  assert.ok(json.contracts.leaderboard);
  assert.ok(json.contracts.referral);
  assert.ok(json.contracts.market);

  // Assert valid Soroban contract address format (starts with C, 56 characters)
  const contractIdPattern = /^C[A-Z2-7]{55}$/;
  assert.match(json.contracts.token, contractIdPattern);
  assert.match(json.contracts.leaderboard, contractIdPattern);
  assert.match(json.contracts.referral, contractIdPattern);
  assert.match(json.contracts.market, contractIdPattern);
});

test("getContracts returns fallback contract mappings", async () => {
  const contracts = await getContracts();
  assert.ok(contracts.token);
  assert.ok(contracts.leaderboard);
  assert.ok(contracts.market);
  assert.ok(contracts.referral);
});

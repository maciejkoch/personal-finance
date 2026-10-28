// A small, deliberate fault-injection audit, not an exhaustive mutation score.
// Only temporary copies of compiled Functions are changed. Source stays intact.
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = fileURLToPath(new URL("../../", import.meta.url));
const functions = join(root, "functions");
const require = createRequire(join(functions, "package.json"));
const mocha = require.resolve("mocha/bin/mocha.js");
const scratch = mkdtempSync(join(tmpdir(), "oszczedzify-mutations-"));
const simulation = "treasury-bonds/bond-simulation.js";
const maths = "calculations/calculations.service.js";

const mutations = [
  [
    "bond tax rounded down",
    simulation,
    "Math.ceil((incomeInCents * 19) / 100)",
    "Math.floor((incomeInCents * 19) / 100)",
  ],
  [
    "bond skipTax ignored",
    simulation,
    "return skipTax ? 0 :",
    "return false ? 0 :",
  ],
  [
    "redemption fee removed",
    simulation,
    "const fee = maturity",
    "const fee = true",
  ],
  [
    "redemption fee not deducted from taxable income",
    simulation,
    "paymentTax(grossRedemption - count * purchasePrice,",
    "paymentTax(grossRedemption + fee * count - count * purchasePrice,",
  ],
  [
    "capitalization removed",
    simulation,
    "capital = accruedValue;",
    "capital = 100;",
  ],
  [
    "coupon counted twice",
    simulation,
    "(cash + coupon)",
    "(cash + 2 * coupon)",
  ],
  [
    "cash interest omitted",
    simulation,
    "cash + savingsInterest - paymentTax",
    "cash + 0 * savingsInterest - paymentTax",
  ],
  [
    "inflation taken one year too early",
    simulation,
    "Math.ceil((cycleStart + periodStart) / 12)",
    "Math.ceil((cycleStart + periodStart) / 12) + 1",
  ],
  [
    "exchange discount removed",
    simulation,
    "Math.round(bond.exchangeCost * 100)",
    "Math.round(100 * 100)",
  ],
  [
    "last observation omitted",
    simulation,
    "month <= maxMonth",
    "month < maxMonth",
  ],
  [
    "zero scenario mistaken for missing data",
    maths,
    "values?.[n - 1] ??",
    "values?.[n - 1] ||",
  ],
  [
    "annuity payments moved to start of month",
    maths,
    "return contribution * annuityFactor(years, rate);",
    "return contribution * annuityFactor(years, rate) * (1 + rate / 12);",
  ],
  [
    "savings goal skipTax ignored",
    "savings/savings.service.js",
    "const tax = skipTax ? 0 :",
    "const tax = false ? 0 :",
  ],
  [
    "portfolio skipTax ignored",
    "calculations/portfolio.js",
    "skipTax ? 0 :",
    "false ? 0 :",
  ],
];

function run() {
  const child = spawnSync(
    process.execPath,
    [mocha, "lib/**/*.test.js", "--reporter", "json"],
    {
      cwd: scratch,
      encoding: "utf8",
      timeout: 30000,
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  assert.ifError(child.error);
  let report;
  try {
    report = JSON.parse(child.stdout);
  } catch {
    throw new Error(
      `Mocha did not return a test report: ${child.stderr}\n${child.stdout.slice(-1000)}`,
    );
  }
  assert.equal(typeof report.stats?.tests, "number");
  return { exitCode: child.status, report };
}

try {
  cpSync(join(functions, "lib"), join(scratch, "lib"), { recursive: true });
  cpSync(join(functions, "content"), join(scratch, "content"), {
    recursive: true,
  });
  // Raw CSV fixtures are not emitted by tsc, but the parser tests need their original bytes.
  cpSync(
    join(functions, "src/inflation/fixtures"),
    join(scratch, "src/inflation/fixtures"),
    { recursive: true },
  );
  symlinkSync(
    join(functions, "node_modules"),
    join(scratch, "node_modules"),
    "dir",
  );
  const baseline = run();
  assert.equal(
    baseline.exitCode,
    0,
    "Unmodified temporary build must pass before testing mutations",
  );
  assert.equal(baseline.report.stats.failures, 0);
  const results = [];
  for (const [name, file, before, after] of mutations) {
    const path = join(scratch, "lib", file);
    const original = readFileSync(path, "utf8");
    assert.equal(
      original.split(before).length - 1,
      1,
      `Review mutation anchor after refactoring: ${name}`,
    );
    let changed;
    try {
      writeFileSync(path, original.replace(before, after));
      changed = run();
    } finally {
      writeFileSync(path, original);
    }
    const detected =
      changed.exitCode !== 0 && changed.report.stats.failures > 0;
    results.push({
      name,
      file,
      sourceSha256: createHash("sha256").update(original).digest("hex"),
      detected,
      failures: changed.report.stats.failures,
      exampleFailingTests: changed.report.failures
        .slice(0, 3)
        .map((test) => test.fullTitle),
    });
    console.log(
      `${detected ? "DETECTED" : "SURVIVED"}: ${name} (${changed.report.stats.failures} failed tests)`,
    );
  }
  const result = {
    baselineTests: baseline.report.stats.tests,
    mutations: results,
    detected: results.filter((result) => result.detected).length,
    total: results.length,
  };
  writeFileSync(
    join(root, "docs/baseline/calculator-mutations.json"),
    JSON.stringify(result, null, 2) + "\n",
  );
  assert.equal(
    result.detected,
    result.total,
    "A deliberate regression survived the suite",
  );
  console.log(
    `PASS: ${result.detected}/${result.total} deliberate mutations detected; ${result.baselineTests} baseline tests pass.`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

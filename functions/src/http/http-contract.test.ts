import { deepStrictEqual, match, ok, strictEqual } from "node:assert";
import type { Request } from "firebase-functions/v2/https";
import { validateSavings } from "../savings/savings.dto";
import { validate as validateContribution } from "../regular-contributions/regular-contributions.dto";
import { execute as savings } from "../savings/savings";
import { execute as contribution } from "../regular-contributions/regular-contributions";
import { execute as bonds } from "../treasury-bonds/treasury-bonds";
import { execute as article } from "../articles/articles";
import type { HttpResponse } from "./query-validation";

function call(handler: typeof savings, query: unknown) {
  let status = 200;
  let body: unknown;
  const response = {
    status(value: number) {
      status = value;
      return this;
    },
    send(value: unknown) {
      body = value;
      return this;
    },
  } as HttpResponse;
  handler({ query } as Request, response);
  return { status, body };
}

const savingsQuery = {
  amount: "10000",
  duration: "2",
  inflation: "0.03",
  rate: "0.05",
};
const contributionQuery = { contribution: "500", duration: "2", rate: "0.05" };

describe("Zod 4 query validation and HTTP compatibility", () => {
  for (const [name, validate, query, money] of [
    ["savings", validateSavings, savingsQuery, "amount"],
    ["contribution", validateContribution, contributionQuery, "contribution"],
  ] as const) {
    it(`${name}: accepts old clients, numeric strings, zero rates and documented limits`, () => {
      const parsed = validate({ ...query, obsoleteField: "ignored" });
      ok(parsed.success);
      strictEqual(parsed.data.skipTax, false);
      strictEqual("obsoleteField" in parsed.data, false);
      for (const duration of ["1", "100"]) {
        for (const rate of ["0", "1"]) {
          ok(
            validate({
              ...query,
              duration,
              rate,
              [money]: "0.01",
              skipTax: "true",
            }).success,
          );
        }
      }
      for (const inflation of ["0", "1"]) {
        ok(validate({ ...query, inflation }).success);
      }
    });

    it(`${name}: rejects malformed values, fractional periods and out-of-range rates`, () => {
      for (const duration of [
        "",
        " ",
        "0",
        "-1",
        "1.5",
        "101",
        "Infinity",
        "NaN",
        [],
        {},
        null,
      ]) {
        strictEqual(
          validate({ ...query, duration }).success,
          false,
          `duration=${JSON.stringify(duration)}`,
        );
      }
      for (const rate of [
        "",
        " ",
        "-0.01",
        "1.01",
        "Infinity",
        [],
        ["0.05"],
        {},
        null,
      ]) {
        strictEqual(
          validate({ ...query, rate }).success,
          false,
          `rate=${JSON.stringify(rate)}`,
        );
      }
      for (const value of ["", "0", "-1", "Infinity", [], ["100"], {}, null]) {
        strictEqual(validate({ ...query, [money]: value }).success, false);
      }
      for (const skipTax of ["yes", "1", "", ["true"], {}, null]) {
        strictEqual(validate({ ...query, skipTax }).success, false);
      }
      strictEqual(validate({}).success, false);
    });
  }

  it("validates inflation at both boundaries without coercing blank or structured input", () => {
    for (const inflation of [
      "",
      " ",
      "-0.01",
      "1.01",
      "Infinity",
      [],
      {},
      null,
    ]) {
      strictEqual(
        validateSavings({ ...savingsQuery, inflation }).success,
        false,
      );
    }
  });

  it("returns a JSON error envelope with paths for all four endpoints", () => {
    for (const handler of [savings, contribution, bonds, article]) {
      const result = call(handler, {});
      strictEqual(result.status, 400);
      const body = JSON.parse(JSON.stringify(result.body));
      deepStrictEqual(Object.keys(body).sort(), ["issues", "name"]);
      strictEqual(body.name, "ZodError");
      ok(body.issues.length > 0);
      for (const issue of body.issues) {
        ok(Array.isArray(issue.path));
        strictEqual(typeof issue.message, "string");
        strictEqual(typeof issue.code, "string");
      }
    }
  });

  it("keeps calculation response envelopes and returns 400 instead of 500 for fractional years", () => {
    for (const [handler, query] of [
      [savings, savingsQuery],
      [contribution, contributionQuery],
    ] as const) {
      strictEqual(call(handler, query).status, 200);
      ok("data" in (call(handler, query).body as object));
      strictEqual(call(handler, { ...query, duration: "1.5" }).status, 400);
    }
  });

  it("renders both articles as HTML strings and distinguishes missing content from malformed slugs", () => {
    for (const slug of [
      "oszczedzaj-regularnie",
      "kalkulator-obligacji-skarbowych",
    ]) {
      const result = call(article, { slug });
      strictEqual(result.status, 200);
      const html = (result.body as { html: string }).html;
      strictEqual(typeof html, "string");
      match(html, /<h1[ >]/);
    }
    strictEqual(call(article, { slug: "missing-article" }).status, 404);
    for (const slug of [
      "",
      "../README",
      "../../package",
      "/etc/passwd",
      "a/b",
      ["oszczedzaj-regularnie"],
    ]) {
      strictEqual(call(article, { slug }).status, 400);
    }
  });
});

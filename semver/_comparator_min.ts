// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Operator, SemVer } from "./types.ts";
import { ANY, MAX, MIN } from "./constants.ts";
import { greaterThan } from "./greater_than.ts";
import { increment } from "./increment.ts";

/**
 * The minimum semantic version that could match this comparator
 * @param semver The semantic version of the comparator
 * @param operator The operator of the comparator
 * @returns The minimum valid semantic version
 */
export function comparatorMin(semver: SemVer, operator: Operator): SemVer {
  if (semver === ANY) {
    return MIN;
  }

  switch (operator) {
    case ">":
      return semver.prerelease && semver.prerelease.length > 0
        ? increment(semver, "pre")
        : increment(semver, "patch");
    case "!=":
    case "!==":
    case "<=":
    case "<":
      // The min(<0.0.0) is MAX
      return greaterThan(semver, MIN) ? MIN : MAX;
    case ">=":
    case "":
    case "=":
    case "==":
    case "===":
      return semver;
  }
}

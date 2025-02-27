// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { Tester } from "./_types.ts";

const customEqualityTesters: Tester[] = [];

export function addCustomEqualityTesters(newTesters: Tester[]) {
  if (!Array.isArray(newTesters)) {
    throw new TypeError(
      `customEqualityTester expects an array of Testers. But got ${typeof newTesters}`,
    );
  }

  customEqualityTesters.push(...newTesters);
}

export function getCustomEqualityTesters() {
  return customEqualityTesters;
}

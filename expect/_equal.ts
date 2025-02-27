// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// This file is copied from `std/assert`.

import { EqualOptions } from "./_types.ts";

function isKeyedCollection(x: unknown): x is Set<unknown> {
  return [Symbol.iterator, "size"].every((k) => k in (x as Set<unknown>));
}

function constructorsEqual(a: object, b: object) {
  return a.constructor === b.constructor ||
    a.constructor === Object && !b.constructor ||
    !a.constructor && b.constructor === Object;
}

/**
 * Deep equality comparison used in assertions
 * @param c actual value
 * @param d expected value
 * @param strictCheck check value in strictMode
 *
 * @example
 * ```ts
 * import { equal } from "https://deno.land/std@$STD_VERSION/assert/equal.ts";
 *
 * equal({ foo: "bar" }, { foo: "bar" }); // Returns `true`
 * equal({ foo: "bar" }, { foo: "baz" }); // Returns `false
 * ```
 */
export function equal(c: unknown, d: unknown, options?: EqualOptions): boolean {
  const { customTesters = [], strictCheck } = options || {};
  const seen = new Map();

  return (function compare(a: unknown, b: unknown): boolean {
    if (customTesters?.length) {
      for (const customTester of customTesters) {
        const pass = customTester.call(undefined, a, b, customTesters);
        if (pass !== undefined) {
          return pass;
        }
      }
    }

    // Have to render RegExp & Date for string comparison
    // unless it's mistreated as object
    if (
      a &&
      b &&
      ((a instanceof RegExp && b instanceof RegExp) ||
        (a instanceof URL && b instanceof URL))
    ) {
      return String(a) === String(b);
    }
    if (a instanceof Date && b instanceof Date) {
      const aTime = a.getTime();
      const bTime = b.getTime();
      // Check for NaN equality manually since NaN is not
      // equal to itself.
      if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
        return true;
      }
      return aTime === bTime;
    }
    if (a instanceof Error && b instanceof Error) {
      return a.message === b.message;
    }
    if (typeof a === "number" && typeof b === "number") {
      return Number.isNaN(a) && Number.isNaN(b) || a === b;
    }
    if (Object.is(a, b)) {
      return true;
    }
    if (a && typeof a === "object" && b && typeof b === "object") {
      if (strictCheck && a && b && !constructorsEqual(a, b)) {
        return false;
      }
      if (a instanceof WeakMap || b instanceof WeakMap) {
        if (!(a instanceof WeakMap && b instanceof WeakMap)) return false;
        throw new TypeError("cannot compare WeakMap instances");
      }
      if (a instanceof WeakSet || b instanceof WeakSet) {
        if (!(a instanceof WeakSet && b instanceof WeakSet)) return false;
        throw new TypeError("cannot compare WeakSet instances");
      }
      if (seen.get(a) === b) {
        return true;
      }

      const aKeys = Object.keys(a || {});
      const bKeys = Object.keys(b || {});
      let aLen = aKeys.length;
      let bLen = bKeys.length;

      if (!strictCheck) {
        if (aLen > 0) {
          for (let i = 0; i < aKeys.length; i += 1) {
            const key = aKeys[i];
            if (
              (key in a) && (a[key as keyof typeof a] === undefined) &&
              !(key in b)
            ) {
              aLen -= 1;
            }
          }
        }

        if (bLen > 0) {
          for (let i = 0; i < bKeys.length; i += 1) {
            const key = bKeys[i];
            if (
              (key in b) && (b[key as keyof typeof b] === undefined) &&
              !(key in a)
            ) {
              bLen -= 1;
            }
          }
        }
      }

      if (aLen !== bLen) {
        return false;
      }
      seen.set(a, b);
      if (isKeyedCollection(a) && isKeyedCollection(b)) {
        if (a.size !== b.size) {
          return false;
        }

        let unmatchedEntries = a.size;

        for (const [aKey, aValue] of a.entries()) {
          for (const [bKey, bValue] of b.entries()) {
            /* Given that Map keys can be references, we need
             * to ensure that they are also deeply equal */
            if (
              (aKey === aValue && bKey === bValue && compare(aKey, bKey)) ||
              (compare(aKey, bKey) && compare(aValue, bValue))
            ) {
              unmatchedEntries--;
              break;
            }
          }
        }

        return unmatchedEntries === 0;
      }
      const merged = { ...a, ...b };
      for (
        const key of [
          ...Object.getOwnPropertyNames(merged),
          ...Object.getOwnPropertySymbols(merged),
        ]
      ) {
        type Key = keyof typeof merged;
        if (!compare(a && a[key as Key], b && b[key as Key])) {
          return false;
        }
        if (
          ((key in a) && (a[key as Key] !== undefined) && (!(key in b))) ||
          ((key in b) && (b[key as Key] !== undefined) && (!(key in a)))
        ) {
          return false;
        }
      }
      if (a instanceof WeakRef || b instanceof WeakRef) {
        if (!(a instanceof WeakRef && b instanceof WeakRef)) return false;
        return compare(a.deref(), b.deref());
      }
      return true;
    }
    return false;
  })(c, d);
}

function isDate(object: any) {
  return object instanceof Date;
}

/** Recursive function that check if an object contains
 * any meaningful data
 *
 * @param ignoreFalsyValues If this is true, and a value is present but is falsy,
 * it will be ignored as if there is nothing there. Default is false.
 */
export function isEmpty(object: any, ignoreFalsyValues = false) {
  if (object === undefined || object === null) return true;

  if (
    typeof object === "number" ||
    typeof object === "boolean" ||
    isDate(object) // Dates don't have enumerable properties, so we need to check them separately
  )
    return false;

  // If this is an iterable that is not a string, recurse
  if (
    typeof object !== "string" &&
    typeof object[Symbol.iterator] === "function"
  ) {
    for (const item of object) {
      if (!isEmpty(item, ignoreFalsyValues)) return false;
    }
    return true;
  }
  // If item is not an iterable but is an object,
  // recurse (but using `for in` instead of `for of`)
  else if (typeof object === "object") {
    for (const key in object) {
      if (!isEmpty(object[key], ignoreFalsyValues)) return false;
    }
    return true;
  }

  // If this is not an iterable nor an object,
  // then this qualifies as a non-empty change
  // If ignoreFalsyValues is set, then a non-empty
  // change no longer includes falsy values.
  return ignoreFalsyValues ? !object : false;
}

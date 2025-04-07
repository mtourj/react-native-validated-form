import { ScrollView } from "react-native";

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

/**
 * Given a node, whether it's ScrollView, FlatList, FlashList, KeyboardAwareScrollView,
 * or any other scrollable node, this function will return the actual scrollable node.
 * (on which we can call methods to scroll the view)
 */
export function getScrollableNode(node: ScrollView | null | undefined) {
  if (node == null) {
    return null;
  }

  if ("scroller" in node) {
    /** When using withUI HOC (like ViewportTracker components), the ref may be
     * a scrollable node, but not the one we want, rather, it will be found under
     * 'scroller', so it should be checked first. */

    return (
      (node as any).scroller?.current?._listRef?._scrollRef ||
      /** The path is unique for FlashList on native platforms: */
      (node as any).scroller?.current?.rlvRef?._scrollComponent?._scrollViewRef
    );
  } else if (
    "scrollToTop" in node ||
    "scrollTo" in node ||
    "scrollToOffset" in node ||
    "scrollResponderScrollTo" in node
  ) {
    // This is already a scrollable node.
    return node;
  } else if ("getScrollResponder" in node) {
    // If the view is a wrapper like FlatList, SectionList etc.
    // We need to use `getScrollResponder` to get access to the scroll responder
    return (node as any).getScrollResponder();
  } else if ("getNode" in node) {
    // When a `ScrollView` is wraped in `Animated.createAnimatedComponent`
    // we need to use `getNode` to get the ref to the actual scrollview.
    // Note that `getNode` is deprecated in newer versions of react-native
    // this is why we check if we already have a scrollable node above.
    return (node as any).getNode();
  } else {
    return node;
  }
}

/** Scrolls any scrollable node to a given offset */
export function scrollTo(
  node: ScrollView | null | undefined,
  offset: { x?: number; y?: number; animated: boolean }
) {
  if (node == null) {
    return;
  }

  const { x, y, animated } = offset;

  if ("scrollTo" in node) {
    (node as any).scrollTo({ x, y, animated });
  } else if ("scrollToOffset" in node) {
    const isHorizontal = (node as any).props?.horizontal;
    (node as any).scrollToOffset({ offset: isHorizontal ? x : y, animated });
  } else if ("scrollResponderScrollTo" in node) {
    (node as any).scrollResponderScrollTo({ x, y, animated });
  }
}

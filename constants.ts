import { StyleProp, TextStyle } from "react-native";

export const DEFAULT_ERROR_STYLE = {
  borderWidth: 1,
  borderColor: "crimson",
};

// For backward compatibility
export const REQUIRED_INPUT_INVALID = DEFAULT_ERROR_STYLE;

// Global configuration
let defaultErrorStyle: StyleProp<TextStyle> = DEFAULT_ERROR_STYLE;

export const setDefaultErrorStyle = (style: StyleProp<TextStyle>) => {
  defaultErrorStyle = style;
};

export const getDefaultErrorStyle = (): StyleProp<TextStyle> => {
  return defaultErrorStyle;
};

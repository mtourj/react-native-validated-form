import React, { ForwardedRef, useContext } from "react";
import {
  StyleProp,
  TextInput,
  TextInputProps,
  TextStyle,
} from "react-native";
import { ValidatedFormContext } from "./ValidatedForm";
import ValidatedAny, { IValidatedAnyProps } from "./ValidatedAny";
import { getDefaultErrorStyle } from "./constants";

interface IValidatedTextInputProps
  extends TextInputProps,
    Omit<IValidatedAnyProps<string>, "disableAutoValidation"> {
  value: string | undefined;
  /** Override default error styling */
  errorStyle?: StyleProp<TextStyle>;
  /**
   * If true, the field will not be validated automatically.
   * If 'while-focused', the field will be validated when the text changes, but not when the input is focused.
   */
  disableAutoValidation?: boolean | "while-focused";
}

export default React.forwardRef(function ValidatedTextInput(
  props: IValidatedTextInputProps,
  ref: ForwardedRef<TextInput>
) {
  const { state, validateField } = useContext(ValidatedFormContext);

  const errorStyle =
    state.fields[props.name]?.valid === false
      ? props.errorStyle ?? getDefaultErrorStyle()
      : {};

  return (
    <ValidatedAny
      {...props}
      disableAutoValidation={!!props.disableAutoValidation}
    >
      <TextInput
        {...props}
        style={[props.style, errorStyle]}
        onBlur={(e) => {
          if (props.disableAutoValidation !== true) validateField(props.name);

          props.onBlur?.(e);
        }}
        ref={ref}
      />
    </ValidatedAny>
  );
});

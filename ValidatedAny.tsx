// import { isEmpty } from 'lodash';
import React, { useCallback, useContext, useEffect, useRef } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { ValidatedFormContext } from "./ValidatedForm";
import { isEmpty } from "./utils";

export interface IValidatedAnyProps<ValueT> {
  /** Name for this field.  */
  name: string;
  /** Is this field required? Default is `true` */
  required?: boolean;
  /** Value of field */
  value: ValueT | undefined;
  containerStyle?:
    | StyleProp<ViewStyle>
    | ((isValid?: boolean) => StyleProp<ViewStyle>);
  /** Define custom per-field validation behavior. Default behavior returns `true`
   * as long as `value` is not falsy, string with only spaces or an empty array or object. */
  validate?: (value: ValueT | undefined) => boolean;
  /** Setting this to true will prevent ValidatedAny from validating the field after every change */
  disableAutoValidation?: boolean;
}

/**
 * A wrapper component for ValidatedForm. Wraps children in a <View /> component and
 * uses onLayout to determine field y-offset for scrolling.
 */
function ValidatedAny<ValueT>(
  props: React.PropsWithChildren<IValidatedAnyProps<ValueT>>,
  ref: React.Ref<View>
) {
  const {
    addField,
    removeField,
    validateField,
    state,
    _internal_scrollView,
    _internal_disableValidateFieldOnChange,
  } = useContext(ValidatedFormContext);

  const isReady = useRef(false);
  isReady.current = state.fields[props.name] !== undefined;

  const childRef = useRef<View | null>(null);

  const propsRef = useRef<IValidatedAnyProps<ValueT>>(props);
  propsRef.current = props;

  const scrollViewRef = useRef(_internal_scrollView);
  scrollViewRef.current = _internal_scrollView;

  const measureYOffset = useCallback(
    () =>
      new Promise<number>((resolve) => {
        if (scrollViewRef.current && childRef.current) {
          // Use native measureLayout API directly on the refs
          childRef.current.measureLayout(
            scrollViewRef.current as any,
            (x: number, y: number) => {
              resolve(y);
            },
            () => {
              // On error, resolve with 0
              resolve(0);
            }
          );
        } else {
          resolve(0);
        }
      }),
    []
  );

  // We don't want changes to validateField to trigger a re-render
  const validateFieldRef = useRef(validateField);
  validateFieldRef.current = validateField;

  useEffect(() => {
    // Make sure we are not running this before field is initialized.
    if (!isReady.current) return;

    // If consumer chooses to disable field validation on state changes,
    // do not continue
    if (_internal_disableValidateFieldOnChange) return;

    // Validate with every state change, unless otherwise specified for this field
    if (!props.disableAutoValidation) validateFieldRef.current(props.name);
  }, [
    props.value,
    props.required,
    _internal_disableValidateFieldOnChange,
    props.disableAutoValidation,
    props.name,
  ]);

  // Validate needs to always have up-to-date props, hence useCallback()
  const validate = useCallback(() => {
    const _props = propsRef.current;

    if (_props.required === false && isEmpty(_props.value, true)) return true;

    if (_props.validate) {
      // If a custom validation function was provided, use it
      return _props.validate(_props.value);
    }

    // Default validation behavior
    return typeof _props.value === "string"
      ? !isEmpty(_props.value.trim(), true)
      : !isEmpty(_props.value, true);
  }, []);

  const initializeField = useCallback(() => {
    // When first adding the field, mark it valid so error styling
    // is not immediately applied.
    addField(props.name, true, validate, measureYOffset);
  }, [addField, measureYOffset, props.name, validate]);
  const initializeFieldRef = useRef(initializeField);
  initializeFieldRef.current = initializeField;

  useEffect(() => {
    initializeFieldRef.current();

    // Cleanup function
    // If this component is unmounted, we want to remove its corresponding field
    // from form state
    return () => {
      removeField(props.name);
    };
  }, [props.name, removeField]);

  const handleRef = (_ref: View) => {
    childRef.current = _ref;
    if (typeof ref === "function") {
      ref(_ref);
    } else if (ref) {
      (ref as React.MutableRefObject<View | null>).current = _ref;
    }
  };

  const childrenWithProps = React.Children.map(props.children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child);
    }

    return child;
  });

  const isValid = state.fields[props.name]?.valid;

  const containerStyle =
    typeof props.containerStyle === "function"
      ? props.containerStyle(isValid)
      : props.containerStyle;

  return (
    <View style={containerStyle} ref={handleRef}>
      {childrenWithProps}
    </View>
  );
}

const ValidatedAnyWithRef = React.forwardRef(ValidatedAny) as <ValueT>(
  props: React.PropsWithChildren<IValidatedAnyProps<ValueT>> & {
    ref?: React.Ref<View>;
  }
) => React.ReactElement;

export default ValidatedAnyWithRef;

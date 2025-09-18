import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from "react-native";
import useBufferedState from "./hooks/useBufferedState";
import { ScrollableComponent } from "./types";
import { ScrollView } from "react-native";
import { getScrollableNode, scrollTo } from "./utils";

interface IValidatedFormProps {
  /** If set, ValidatedForm will not automatically validate fields when their state is updated. Default is `false` */
  disableValidateFieldOnChange?: boolean;
}

export type ScrollEvent = Pick<
  NativeSyntheticEvent<Pick<NativeScrollEvent, "contentOffset">>,
  "nativeEvent"
>;

export type ValidatedFormFields = {
  [fieldName: string]: ValidatedFieldState | undefined;
};

type ValidatedFieldState = {
  valid: boolean;
  yOffset: number;
  measureYOffset: () => Promise<number>;
  validateCallback: () => boolean;
};

type ValidatorState = {
  ready: boolean;
  fields: ValidatedFormFields;
};

export type FormContext = {
  readonly state: ValidatorState;
  readonly removeField: (fieldName: string) => void;
  readonly addField: (
    fieldName: string,
    valid: boolean,
    validateCallback: () => boolean,
    measureYOffset: () => Promise<number>
  ) => void;
  readonly resetValidations: () => void;
  readonly validateField: (fieldName: string) => void;
  readonly updateFieldOffsetY: (fieldName: string, yOffset: number) => void;
  readonly validateForm: () => boolean;
  readonly _internal_setScrollViewRef: (
    ref:
      | React.RefObject<
          ScrollView | ScrollableComponent<any, any> | undefined | null
        >
      | undefined
  ) => void;
  readonly _internal_setExtraScrollHeight: (value: number) => void;
  readonly _internal_extraScrollHeight: number;
  readonly _internal_setScrollY: (value: number | undefined) => void;
  readonly _internal_scrollViewRef:
    | React.RefObject<
        ScrollView | ScrollableComponent<any, any> | undefined | null
      >
    | undefined;
  readonly _internal_disableValidateFieldOnChange: boolean | undefined;
};

const DEFAULT_VALIDATOR_STATE: ValidatorState = {
  ready: false,
  fields: {},
};

let ctx = React.createContext<FormContext>(null as any);

export default function ValidatedForm(
  props: React.PropsWithChildren<IValidatedFormProps>
) {
  /** useBufferedState to avoid lag spikes when initializing large forms */
  const [validatorState, setValidatorState] = useBufferedState<ValidatorState>(
    DEFAULT_VALIDATOR_STATE
  );

  useEffect(() => {
    // Initialize the form by setting ready to true
    // This state change will happen at the same time as we set all initially rendered fields
    // into state if any exist
    /**
     * We use this to ensure that we never return true in validateForm() until all
     * fields have been added to state, but also without requiring us to have any
     * fields in the form to begin with.
     */
    setValidatorState((prevState) => ({
      ...prevState,
      ready: true,
    }));
  }, [setValidatorState]);

  const scrollYRef = useRef<number | undefined>(undefined);
  const scrollViewRef = useRef<
    ScrollView | ScrollableComponent<any, any> | undefined | null
  >(undefined);
  const [extraScrollHeight, setExtraScrollHeight] = useState(0);

  const setScrollViewRef = useCallback(
    (
      ref:
        | React.RefObject<
            ScrollView | ScrollableComponent<any, any> | undefined | null
          >
        | undefined
    ): void => {
      if (!ref?.current) {
        scrollViewRef.current = undefined;
        return;
      }

      scrollViewRef.current = ref.current;
    },
    []
  );

  const updateFieldOffsetY = useCallback(
    (name: string, yOffset: number) => {
      setValidatorState((prevState) => {
        const newState = { ...prevState };

        const field = newState.fields[name];

        if (field) field.yOffset = yOffset;

        return newState;
      });
    },
    [setValidatorState]
  );

  const addField = useCallback(
    (
      name: string,
      valid: boolean,
      validateCallback: () => boolean,
      mesaureYOffset: () => Promise<number>
    ) => {
      if (validatorState.fields[name]) {
        // If we are adding a field that already exists, user has created two
        // or more fields with the same name, which is illegal
        console.warn(
          `Found two or more fields with name ${name}. This will cause unexpected behavior when validating form.`
        );

        return;
      }

      // Update validatorState and validatorCallbacks
      setValidatorState((prevState) => {
        const newField: ValidatedFormFields[string] = {
          valid,
          measureYOffset: mesaureYOffset,
          yOffset: 0,
          validateCallback,
        };

        return {
          ...prevState,
          fields: {
            ...prevState.fields,
            [name]: newField,
          },
        };
      });
    },
    [setValidatorState, validatorState.fields]
  );

  const removeField = useCallback(
    (name: string) => {
      setValidatorState((prevState) => {
        // Remove from fields
        const newState = { ...prevState };
        delete newState.fields[name];

        return newState;
      });
    },
    [setValidatorState]
  );

  const validateField = useCallback(
    (name: string) => {
      const field = validatorState.fields[name];

      if (!field) {
        console.log("Trying to validate non-existing field!");
        return;
      }

      // If `valid` has not changed, do nothing
      if (field.valid === field.validateCallback()) return;

      setValidatorState((prevState) => {
        const newState = { ...prevState };

        const isValid = field.validateCallback();

        const targetField = newState.fields[name];

        if (targetField) targetField.valid = isValid;

        return newState;
      });
    },
    [validatorState.fields, setValidatorState]
  );

  const measureYOffsets = useCallback(() => {
    Object.entries(validatorState.fields).forEach(([name, field]) => {
      if (!field) return;

      field.measureYOffset().then((yOffset) => {
        /** `measureYOffset` works differently in react-native-web. We have to account for the
         * current scroll position in order to get the correct yOffset */
        const webAdjustment =
          Platform.OS === "web" ? scrollYRef.current ?? 0 : 0;

        updateFieldOffsetY(name, yOffset + webAdjustment);
      });
    });
  }, [updateFieldOffsetY, validatorState.fields]);

  /**
   * Updates validator state calling validate() for each field
   * @returns boolean - True if form is valid, false otherwise
   */
  const validateForm = useCallback(() => {
    if (validatorState.ready === false) return false;

    let isFormValid = true;

    measureYOffsets();

    const newState = { ...validatorState };

    Object.keys(newState.fields).forEach((fieldName) => {
      const isValid = newState.fields[fieldName]?.validateCallback();

      // console.log(`${fieldName} is valid?`, isValid);

      // If we encounter an invalid field, set isFormValid to false
      if (!isValid) isFormValid = false;

      const field = newState.fields[fieldName];

      // If `valid` is unchanged, skip to next field
      if (isValid === field?.valid) return;

      if (field) field.valid = !!isValid;
    });

    setValidatorState(() => newState);

    return isFormValid;
  }, [validatorState, measureYOffsets, setValidatorState]);

  const resetValidations = useCallback(() => {
    setValidatorState((prevState) => {
      const newState = { ...prevState };

      Object.keys(newState.fields).forEach((fieldName) => {
        const field = newState.fields[fieldName];

        if (field) field.valid = true;
      });

      return newState;
    });
  }, [setValidatorState]);

  /** Works around scroll event not firing on react-native-web under certain conditions */
  const setScrollY = useCallback((value: number | undefined) => {
    scrollYRef.current = value;
  }, []);

  return (
    <ctx.Provider
      value={{
        addField,
        removeField,
        validateField,
        validateForm,
        resetValidations,
        updateFieldOffsetY,
        _internal_setScrollY: setScrollY,
        _internal_setScrollViewRef: setScrollViewRef,
        _internal_setExtraScrollHeight: setExtraScrollHeight,
        _internal_extraScrollHeight: extraScrollHeight,
        _internal_scrollViewRef: scrollViewRef,
        _internal_disableValidateFieldOnChange:
          props.disableValidateFieldOnChange,
        state: validatorState,
      }}
    >
      {props.children}
    </ctx.Provider>
  );
}

export { ctx as ValidatedFormContext };

export type UseFormValidationContextReturns = {
  /** Scrolls to first invalid field */
  scrollToInvalidFields: () => void;
  /** Validates all fields */
  validateForm: (scrollIfInvalid?: boolean) => boolean;
  /** Resets all fields to valid */
  resetValidations: () => void;
  /** Use for dynamic forms. Makes sure correct y-offset measurement
   * for fields added after scrolling */
  onScroll: (e: ScrollEvent) => void;
  /** Returns all fields in form */
  fields: Partial<ValidatedFormFields>;
};

/** Hook for form validation actions */
export const useFormValidationContext = (
  /** Required for scrolling to invalid fields. If this is not provided, scrolling
   * will be disabled.
   */
  scrollViewRef?: React.RefObject<
    ScrollView | ScrollableComponent<any, any> | undefined | null
  >,
  /** Default is `40` */
  extraScrollHeightHeight = 40
): UseFormValidationContextReturns => {
  const _context = useContext(ctx);

  if (!_context) {
    throw new Error(
      "[ValidatedForm] useFormValidationContext hook was called but no context could be found. Make sure you are wrapping your component in withFormValidation or <ValidatedForm />"
    );
  }

  const {
    state,
    validateForm: _validate,
    _internal_setExtraScrollHeight,
    _internal_extraScrollHeight,
    _internal_scrollViewRef,
    _internal_setScrollViewRef,
    _internal_setScrollY,
  } = _context;

  const queueScrollToInvalidFields = useRef(false);

  useEffect(() => {
    if (typeof extraScrollHeightHeight === "number") {
      _internal_setExtraScrollHeight(extraScrollHeightHeight);
    }
  }, [extraScrollHeightHeight, _internal_setExtraScrollHeight]);

  /** This side effect handles updating scrollViewNodeHandle */
  useEffect(() => {
    if (scrollViewRef?.current) {
      _internal_setScrollViewRef(scrollViewRef);
    } else {
      _internal_setScrollViewRef(undefined);
    }
  }, [scrollViewRef, _internal_setScrollViewRef]);

  /** Scrolls to invalid field with lowest y-offset value */
  const scrollToInvalidFields = useCallback(
    function () {
      const _scrollView = _internal_scrollViewRef?.current;
      const scrollableNode = getScrollableNode(_scrollView as any);

      if (!scrollableNode) return;

      let shouldScroll = false,
        shouldScrollToOffset: number | undefined;

      /** DEBUG */
      // console.log('scrolling, fields:', state.fields);

      Object.entries(state.fields ?? {}).forEach(([, field]) => {
        if (!field) return;

        if (!field.valid) {
          shouldScroll = true;

          if (
            typeof shouldScrollToOffset !== "number" ||
            field.yOffset < shouldScrollToOffset
          ) {
            shouldScrollToOffset = field.yOffset;
          }
        }
      });

      if (shouldScroll && typeof shouldScrollToOffset === "number") {
        // Add padding to scroll position
        shouldScrollToOffset = Math.max(
          shouldScrollToOffset - _internal_extraScrollHeight,
          0
        );

        // Use the scrollTo utility function
        scrollTo(scrollableNode, {
          y: shouldScrollToOffset,
          animated: true,
        });
      }
    },
    [_internal_scrollViewRef, _internal_extraScrollHeight, state.fields]
  );

  useEffect(() => {
    if (queueScrollToInvalidFields.current) {
      scrollToInvalidFields();
      queueScrollToInvalidFields.current = false;
    }
  }, [scrollToInvalidFields, state]);

  /**
   * Validate all form fields.
   * @param scrollIfInvalid If form is invalid, scrolls to first invalid field. Default is `true`.
   * @returns boolean - True if form is valid, false otherwise.
   */
  const validateForm = (scrollIfInvalid = true) => {
    const isValid = _validate();

    if (!isValid && scrollIfInvalid) {
      queueScrollToInvalidFields.current = true;
    }

    return isValid;
  };

  const onScroll = useCallback(
    (e: ScrollEvent) => {
      const { contentOffset } = e.nativeEvent;

      _internal_setScrollY(contentOffset.y);
    },
    [_internal_setScrollY]
  );

  return {
    scrollToInvalidFields,
    validateForm,
    resetValidations: _context.resetValidations,
    onScroll,
    fields: state.fields as Partial<ValidatedFormFields>,
  };
};

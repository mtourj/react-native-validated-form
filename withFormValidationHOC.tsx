import React from 'react';
import ValidatedForm from './ValidatedForm';

type FormValidatorOptions = {
  /** If set, ValidatedForm will not automatically validate fields when their state is updated. Default is `false` */
  disableValidateFieldOnChange?: boolean;
};

/** HOC that provides form validator context & functionality to a component */
export default function withFormValidation<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: FormValidatorOptions,
) {
  function Component(props: P) {
    return (
      <ValidatedForm {...options}>
        <WrappedComponent {...props} />
      </ValidatedForm>
    );
  }

  Object.defineProperty(Component, 'name', {
    value: `WithFormValidation(${
      WrappedComponent.displayName || WrappedComponent.name
    })`,
    writable: false,
  });

  return Component;
}

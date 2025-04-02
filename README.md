# React Native Validated Form

A flexible, lightweight, and easy-to-use form validation library for React Native applications.

## Installation

```bash
npm install @mtourj/react-native-validated-form
# or
yarn add @mtourj/react-native-validated-form
```

## Key Features

- 🔍 **Automatic Validation**: Validates form fields as values change
- 📜 **Auto-Scrolling**: Scrolls to the first invalid field when form validation fails
- 🧩 **Reusable Components**: Includes `ValidatedTextInput` and `ValidatedAny` for different field types
- 🛠️ **Custom Validation**: Define field-specific validation rules
- 🔄 **Form State Management**: Tracks validation state for all fields

## ⚠️ Important Setup Requirements

### ScrollView Integration

For the auto-scrolling feature to work correctly, you **must**:

1. Create a reference to your ScrollView
2. Pass this reference to `useFormValidationContext`
3. Set the `onScroll` prop on your ScrollView using the function returned from the context

```jsx
const scrollViewRef = useRef();
const { validateForm, onScroll } = useFormValidationContext(scrollViewRef);

return (
  <ScrollView
    ref={scrollViewRef}
    onScroll={onScroll} // Required for automatic scrolling to invalid fields
  >
    {/* Your form fields */}
  </ScrollView>
);
```

This setup is essential for:
- The auto-scrolling feature to navigate to invalid fields
- Correct measurement of field positions within the form

## Basic Usage

Here's a simple example showing how to use this package:

```jsx
import React, { useRef, useState } from 'react';
import { ScrollView, Text, View, Button } from 'react-native';
import {
  ValidatedTextInput,
  ValidatedAny,
  withFormValidation,
  useFormValidationContext,
} from '@mtourj/react-native-validated-form';

function MyForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const scrollViewRef = useRef();
  const { validateForm, onScroll } = useFormValidationContext(scrollViewRef);
  
  const handleSubmit = () => {
    if (validateForm()) {
      // Form is valid, proceed with submission
      console.log('Form submitted successfully');
    }
  };
  
  return (
    <ScrollView 
      ref={scrollViewRef}
      onScroll={onScroll} // Important for auto-scrolling
    >
      <ValidatedTextInput
        name="name"
        value={name}
        onChangeText={setName}
        placeholder="Name"
      />
      
      <ValidatedTextInput
        name="email"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        validate={(value) => {
          // Custom validation for email
          return /\S+@\S+\.\S+/.test(value);
        }}
      />
      
      <Button title="Submit" onPress={handleSubmit} />
    </ScrollView>
  );
}

// Wrap your component with the HOC
export default withFormValidation(MyForm);
```

## Global Configuration

### Setting Default Error Styles

You can configure the default error styling for all `ValidatedTextInput` components:

```jsx
import { setDefaultErrorStyle } from '@mtourj/react-native-validated-form';

// Set your custom error style globally
setDefaultErrorStyle({
  borderWidth: 2,
  borderColor: 'red',
  backgroundColor: 'rgba(255, 0, 0, 0.05)',
});

// This should be called once, typically in your app's entry point
```

Individual components can still override the global style:

```jsx
<ValidatedTextInput
  name="email"
  value={email}
  onChangeText={setEmail}
  // Override global error styling just for this component
  errorStyle={{ borderColor: 'orange', borderWidth: 1 }}
/>
```

## Components

### ValidatedForm

The context provider component. Usually used via the `withFormValidation` HOC.

```jsx
<ValidatedForm disableValidateFieldOnChange={false}>
  {/* Form contents */}
</ValidatedForm>
```

### ValidatedTextInput

A wrapper around React Native's TextInput with validation capabilities.

```jsx
<ValidatedTextInput
  name="fieldName" // Required and must be unique
  value={value} // Required
  onChangeText={setValue}
  required={true} // Default: true
  validate={(value) => {
    // Optional custom validation logic
    return value.length >= 3;
  }}
  disableAutoValidation={false} // Optional, default: false
  errorStyle={{}} // Optional, overrides global error style
  // All standard TextInput props are supported
/>
```

### ValidatedAny

A flexible validation wrapper for any React Native component or custom input.

```jsx
<ValidatedAny
  name="customField"
  value={value}
  required={true}
  validate={(value) => {
    // Custom validation logic
    return Array.isArray(value) && value.length > 0;
  }}
>
  {/* Any component(s) */}
  <CustomInput 
    value={value}
    onChange={setValue}
  />
</ValidatedAny>
```

## Hooks

### useFormValidationContext

Provides methods and state for form validation.

```jsx
const {
  validateForm, // Function to validate all fields, returns boolean
  scrollToInvalidFields, // Function to scroll to the first invalid field
  resetValidations, // Function to reset all validations
  onScroll, // Event handler for ScrollView (Required for auto-scrolling)
  fields, // Object containing all field states
} = useFormValidationContext(scrollViewRef);
```

## Advanced Usage

### Custom Validation Logic

You can create custom validation logic for any field:

```jsx
<ValidatedTextInput
  name="password"
  value={password}
  onChangeText={setPassword}
  validate={(value) => {
    // Password must be at least 8 characters and include a number
    return value.length >= 8 && /\d/.test(value);
  }}
/>
```

### Working with KeyboardAwareScrollView

This library works with KeyboardAwareScrollView and similar components:

```jsx
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

function MyForm() {
  const scrollViewRef = useRef();
  const { validateForm, onScroll } = useFormValidationContext(scrollViewRef);
  
  return (
    <KeyboardAwareScrollView
      ref={(r) => {
        if (r) scrollViewRef.current = r;
      }}
      onScroll={onScroll}
    >
      {/* Form fields */}
    </KeyboardAwareScrollView>
  );
}
```

### Complex Forms with Nested Components

For complex forms with multiple sections or nested components:

```jsx
function ParentForm() {
  const scrollViewRef = useRef();
  const { validateForm, onScroll } = useFormValidationContext(scrollViewRef);
  
  return (
    <ScrollView 
      ref={scrollViewRef}
      onScroll={onScroll}
    >
      <UserInfoSection />
      <AddressSection />
      <PaymentSection />
      
      <Button 
        title="Submit" 
        onPress={() => {
          if (validateForm()) {
            // Handle submission
          }
        }} 
      />
    </ScrollView>
  );
}

// Child components can use the same context
function UserInfoSection() {
  const [name, setName] = useState('');
  // ...
  
  return (
    <View>
      <ValidatedTextInput
        name="user.name"
        value={name}
        onChangeText={setName}
      />
      {/* Other fields */}
    </View>
  );
}

export default withFormValidation(ParentForm);
```

### Disabling Automatic Validation

If you prefer to only validate on form submission:

```jsx
export default withFormValidation(MyForm, { 
  disableValidateFieldOnChange: true 
});
```

Or for individual fields:

```jsx
<ValidatedTextInput
  name="email"
  value={email}
  onChangeText={setEmail}
  disableAutoValidation={true}
/>
```

## Common Patterns and Tips

1. **Field Names**: Always use unique names for each field
2. **Field Dependencies**: When fields depend on each other, use a single `ValidatedAny` to wrap related fields
3. **Error Styling**: Custom error styles can be applied through the `errorStyle` prop on `ValidatedTextInput` or globally with `setDefaultErrorStyle`
4. **Dynamic Forms**: For dynamic fields (added/removed during runtime), ensure unique names are generated
5. **ScrollView Setup**: Don't forget to set both the `ref` and `onScroll` props on your ScrollView

## License

ISC

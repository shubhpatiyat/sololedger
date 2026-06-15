import * as yup from 'yup';

// Common email validation
export const emailValidation = yup
  .string()
  .required('Email is required')
  .email('Please enter a valid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(100, 'Email must be less than 100 characters');

// Common password validation
export const passwordValidation = yup
  .string()
  .required('Password is required');

// Strong password validation (for new passwords)
export const strongPasswordValidation = yup
  .string()
  .required('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

// Login schema
export const loginSchema = yup.object().shape({
  email: emailValidation,
  password: passwordValidation,
  captcha: yup.string().when([], {
      is: () => true,
      then: (schema) => schema,
      otherwise: (schema) => schema
    })
});

// Signup schema
export const signupSchema = yup.object().shape({
  firstName: yup
    .string()
    .trim()
    .max(120, 'First name must be less than 120 characters'),
  lastName: yup
    .string()
    .trim()
    .max(120, 'Last name must be less than 120 characters'),
  email: emailValidation,
  password: strongPasswordValidation,
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
});

// Forgot password schema
export const forgotPasswordSchema = yup.object().shape({
  email: emailValidation,
});

// Reset password schema
export const resetPasswordSchema = yup.object().shape({
  oldPassword: passwordValidation.min(6, 'Current password must be at least 6 characters'),
  newPassword: strongPasswordValidation,
  confirmPassword: yup
    .string()
    .required('Please confirm your new password')
    .oneOf([yup.ref('newPassword')], 'Passwords do not match')
});

// Update password with token schema
export const updatePasswordSchema = yup.object().shape({
  password: strongPasswordValidation,
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match')
});

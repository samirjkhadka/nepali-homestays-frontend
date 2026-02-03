/**
 * Strong password validation.
 * Requirements: min 8 chars, at least one uppercase, one lowercase, one number, one special character.
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  if (password.length < MIN_LENGTH) {
    errors.push(`At least ${MIN_LENGTH} characters`);
  }
  if (password.length > MAX_LENGTH) {
    errors.push(`At most ${MAX_LENGTH} characters`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('At least one number');
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('At least one special character (!@#$%^&* etc.)');
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

export const PASSWORD_HINT = `Password must be at least ${MIN_LENGTH} characters with uppercase, lowercase, number and special character.`;

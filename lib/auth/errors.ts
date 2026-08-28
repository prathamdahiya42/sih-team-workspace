/**
 * Translates Supabase Auth & SMTP/Resend errors into clean, user-friendly messages.
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) {
    return 'An unexpected authentication error occurred. Please try again.';
  }

  const rawMessage =
    typeof error === 'string'
      ? error
      : error.message || error.error_description || error.msg || '';

  const lower = rawMessage.toLowerCase();

  // 1. Custom SMTP / Resend Email Sending Errors
  if (
    lower.includes('error sending') ||
    lower.includes('smtp') ||
    lower.includes('resend') ||
    lower.includes('connection refused') ||
    lower.includes('535') ||
    lower.includes('550') ||
    lower.includes('534') ||
    lower.includes('authentication failed') ||
    lower.includes('failed to send email') ||
    lower.includes('email provider')
  ) {
    return 'Unable to send authentication email through the mail server. Please verify your custom SMTP (Resend) settings in your Supabase Dashboard (Authentication → Email Settings), or try again shortly.';
  }

  // 2. Email Send Rate Limits / Quotas
  if (
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('email rate limit exceeded') ||
    lower.includes('for security purposes, you can only request this once') ||
    lower.includes('rate limit') ||
    lower.includes('rate_limit')
  ) {
    return 'Too many email requests sent recently. Please wait a couple of minutes before requesting another confirmation or login email.';
  }

  // 3. User Already Registered
  if (
    lower.includes('user already registered') ||
    lower.includes('user_already_exists') ||
    lower.includes('already registered') ||
    lower.includes('already exists')
  ) {
    return 'An account with this email address already exists. Please sign in with your password, request a magic link, or reset your password.';
  }

  // 4. Invalid Login Credentials
  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid_credentials') ||
    lower.includes('invalid email or password')
  ) {
    return 'Invalid email or password. Please verify your credentials and try again.';
  }

  // 5. Unconfirmed Email Address
  if (lower.includes('email not confirmed')) {
    return 'Your email address is not confirmed yet. Please check your inbox for the activation link, or request a new login email.';
  }

  // 6. Expired or Invalid Confirmation / Recovery Token
  if (
    lower.includes('otp expired') ||
    lower.includes('token has expired') ||
    lower.includes('token is invalid') ||
    lower.includes('access_denied') ||
    lower.includes('invalid token') ||
    lower.includes('token not found')
  ) {
    return 'This link has expired or has already been used. Please request a new confirmation, magic link, or password reset email.';
  }

  // 7. Network / Fetch Failures
  if (
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('econnrefused')
  ) {
    return 'Unable to connect to the authentication server. Please check your internet connection or deployment environment variables (NEXT_PUBLIC_SUPABASE_URL).';
  }

  // 8. Password Requirements
  if (
    lower.includes('password should be at least') ||
    lower.includes('weak_password') ||
    lower.includes('password is too short')
  ) {
    return 'Password is too short. Please choose a password with at least 6 characters.';
  }

  // 9. Invalid Email Address Format
  if (
    lower.includes('unable to validate email') ||
    lower.includes('email_address_invalid') ||
    lower.includes('invalid email')
  ) {
    return 'Please enter a valid email address format (e.g. teammate@college.edu).';
  }

  // Return original sanitized message if available, else clean fallback
  return rawMessage || 'Authentication request failed. Please try again.';
}

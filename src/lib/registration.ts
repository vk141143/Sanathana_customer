export interface RegistrationUser { uid: string; email: string | null; emailVerified: boolean }
export interface RegistrationDependencies<U extends RegistrationUser> {
  create: (email: string, password: string) => Promise<U>;
  signIn: (email: string, password: string) => Promise<U>;
  profileExists: () => Promise<boolean>;
  saveProfile: (name: string, mobile: string) => Promise<unknown>;
  sendVerification: (user: U) => Promise<void>;
}
/** Firebase creation cannot be rolled back with a profile transaction. Recover by proving ownership. */
export async function registerAccount<U extends RegistrationUser>(
  input: { email: string; password: string; name: string; mobile: string }, deps: RegistrationDependencies<U>,
) {
  const email = input.email.trim();
  let user: U;
  try { user = await deps.create(email, input.password); }
  catch (error) {
    if ((error as {code?:string}).code !== 'auth/email-already-in-use') throw error;
    // Never claim an existing profile merely because the submitted email matches.
    user = await deps.signIn(email, input.password);
    if (await deps.profileExists()) throw new Error('This account already exists. Please sign in, or resend verification from the sign-in screen.');
  }
  await deps.saveProfile(input.name.trim(), input.mobile.trim());
  if (user.emailVerified) return 'Your profile is ready. Please sign in.';
  try { await deps.sendVerification(user); }
  catch { return 'Your account and profile are saved, but the verification email could not be sent. Sign in and use Resend verification email to retry.'; }
  return 'Account created! Please check your email to verify your account, then sign in.';
}
export function authErrorMessage(error: unknown, fallback: string) {
  const code = (error as {code?:string}).code;
  const messages: Record<string,string> = {
    'auth/email-already-in-use': 'This email already has an account. Sign in or reset your password.',
    'auth/invalid-credential': 'The email or password is incorrect. If you registered earlier, try resetting your password.',
    'auth/operation-not-allowed': 'This sign-in method is disabled. Please contact support.',
    'auth/unauthorized-domain': 'Sign-in is not enabled for this website. Please contact support.',
    'auth/network-request-failed': 'Unable to connect. Check your internet connection and retry.',
    'auth/too-many-requests': 'Too many attempts. Please wait before trying again.',
    'auth/weak-password': 'Choose a stronger password with at least 6 characters.',
  };
  return (code && messages[code]) || (error as {message?:string}).message?.replace('Firebase: ', '') || fallback;
}

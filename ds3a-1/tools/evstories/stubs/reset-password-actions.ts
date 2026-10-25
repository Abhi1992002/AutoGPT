// Evidence build only: reset-password/page.tsx's two server actions reach the database client, which
// cannot bundle into Storybook (the repo's Storybook swaps lib/auth/actions the same way). Rendering
// never calls them.
export async function sendResetEmail(_email: string) {
  return { error: null as string | null };
}
export async function changePassword(_password: string, _token: string) {
  return { error: null as string | null };
}

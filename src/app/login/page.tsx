import { getHomepageAnimatedBackground } from "@/lib/settings";
import LoginClient from "./LoginClient";

// Server wrapper so the sign-in page can read the dashboard's animated-
// background setting — the form itself is a Client Component, which can't.
// Saving that setting revalidates every route (revalidatePath("/", "layout")),
// so this picks the change up straight away.
export default async function LoginPage() {
  return <LoginClient animatedBackground={await getHomepageAnimatedBackground()} />;
}

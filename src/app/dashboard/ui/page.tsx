import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getHomepageAnimatedBackground } from "@/lib/settings";
import UiSettingsForm from "@/components/dashboard/UiSettingsForm";

// Admin-only: front-end UI toggles.
export default async function UiSettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const homepageAnimatedBackground = await getHomepageAnimatedBackground();

  return <UiSettingsForm initialEnabled={homepageAnimatedBackground} />;
}

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getHomepageAnimatedBackground, getThemeSettings } from "@/lib/settings";
import UiSettingsForm from "@/components/dashboard/UiSettingsForm";

export default async function UiSettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const [homepageAnimatedBackground, theme] = await Promise.all([
    getHomepageAnimatedBackground(),
    getThemeSettings(),
  ]);

  return (
    <UiSettingsForm
      initialEnabled={homepageAnimatedBackground}
      initialTheme={theme.uiTheme}
      initialAccents={theme.modernAccents}
      initialBrutalistAccents={theme.brutalistAccents}
      initialDarkSurfaces={theme.darkSurfaces}
      initialHeadingType={theme.headingType}
    />
  );
}
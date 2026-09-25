"use client";

import { useBranding } from "@/components/layout/BrandingContext";

const SITE_NAME = "Blog";

/**
 * The site's brand mark: the admin-uploaded logo, or the "Blog" wordmark when
 * none is set. With a dark-mode logo both images are rendered and CSS picks
 * one off the `.dark` class, so the right one is in the first paint instead of
 * swapping after hydration.
 *
 * `imgClassName` sizes the image: a height, plus a max width so a very wide
 * logo can't crowd its neighbours (width otherwise follows the aspect ratio).
 * `textClassName` styles the wordmark fallback.
 */
export default function SiteLogo({
  imgClassName = "h-8 max-w-[200px]",
  textClassName = "",
}: {
  imgClassName?: string;
  textClassName?: string;
}) {
  const { logo, logoDark } = useBranding();

  if (!logo) return <span className={textClassName}>{SITE_NAME}</span>;

  const img = `${imgClassName} w-auto object-contain`;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} alt={SITE_NAME} className={`${img} ${logoDark ? "block dark:hidden" : "block"}`} />
      {logoDark && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoDark} alt={SITE_NAME} className={`${img} hidden dark:block`} />
      )}
    </>
  );
}

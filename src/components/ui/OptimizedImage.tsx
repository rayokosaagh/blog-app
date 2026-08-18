import Image from "next/image";

/**
 * Wrapper that routes an image through next/image when — and only when — the
 * optimizer can actually handle its source, falling back to a plain <img>
 * otherwise.
 *
 * Two sources on this site cannot go through the optimizer:
 *
 * 1. External URLs. Uploaded media is always root-relative ("/uploads/..."),
 *    because /api/upload writes to public/uploads and returns that path. But
 *    the gadget dashboard also offers "Or paste an image URL" for products,
 *    so a product image can be any host. Those hosts are not in next.config's
 *    `images.remotePatterns`, and passing an unconfigured host to <Image>
 *    THROWS at render — one pasted URL would take down every page listing
 *    that product. Widening remotePatterns to a wildcard is the other way to
 *    fix this, but it turns the optimizer into an open resize proxy for
 *    arbitrary remote images, so falling back is the safer trade.
 *
 * 2. Animated GIFs. The optimizer re-encodes them to a single static frame.
 *    Spotlight ads explicitly support GIFs (see isGif/gifDurationMs in
 *    SpotlightAdRail), so optimizing one would silently freeze the ad.
 *
 * Everything else — the overwhelming majority — gets a resized, modern-format
 * variant and a responsive srcset.
 */
function canOptimize(src: string) {
  if (!src.startsWith("/")) return false;
  if (/\.gif(\?|#|$)/i.test(src)) return false;
  return true;
}

type BaseProps = {
  src: string;
  alt: string;
  className?: string;
  /** Marks this as the LCP image: eager, high priority, preloaded. */
  priority?: boolean;
};

type Props = BaseProps &
  (
    | {
        /** Fills a positioned parent. The parent MUST be position:relative. */
        fill: true;
        /** Required with `fill` — without it the browser assumes 100vw. */
        sizes: string;
      }
    | { fill?: false; width: number; height: number }
  );

export default function OptimizedImage(props: Props) {
  const { src, alt, className, priority } = props;

  if (!canOptimize(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...(props.fill ? {} : { width: props.width, height: props.height })}
      />
    );
  }

  if (props.fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={props.sizes}
        priority={priority}
        className={className}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={props.width}
      height={props.height}
      priority={priority}
      className={className}
    />
  );
}

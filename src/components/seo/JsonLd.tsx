// src/components/seo/JsonLd.tsx

/**
 * Emits a JSON-LD structured-data block.
 *
 * Structured data is what lets Google render a result as an article card or a
 * product listing (headline, author, date, rating) rather than a plain blue
 * link. Next's Metadata API has no field for it, so it goes in the body as a
 * script tag — which is explicitly supported by the spec.
 *
 * The payload is serialised with JSON.stringify and then has its `<` escaped:
 * a post title or spec value containing `</script>` would otherwise close the
 * tag early and inject arbitrary markup into the page.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      // The content is our own serialised object, never raw user HTML.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

import { FadeIn } from "@/components/AnimatedSection";

export default function Footer() {
  return (
    <footer className="bg-footer text-foreground border-t border-border mt-20">
      <FadeIn>
        <div className="max-w-6xl mx-auto px-6 py-12 text-center text-muted-foreground">
          <p></p>
        </div>
      </FadeIn>
    </footer>
  );
}
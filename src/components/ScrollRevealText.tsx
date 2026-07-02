// "use client";

// import { useRef } from "react";
// import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

// interface WordProps {
//   children: string;
//   range: [number, number];
//   progress: ReturnType<typeof useScroll>["scrollYProgress"];
// }

// function Word({ children, range, progress }: WordProps) {
//   const opacity = useTransform(progress, range, [0.15, 1]);
//   const blur = useTransform(progress, range, [6, 0]);
//   const filter = useTransform(blur, (v) => `blur(${v}px)`);

//   return (
//     <motion.span style={{ opacity, filter }} className="relative mr-2 inline-block md:mr-3">
//       {children}
//     </motion.span>
//   );
// }

// export default function ScrollRevealText({
//   text,
//   className = "",
// }: {
//   text: string;
//   className?: string;
// }) {
//   const container = useRef<HTMLDivElement>(null);
//   const prefersReducedMotion = useReducedMotion();

//   const { scrollYProgress } = useScroll({
//     target: container,
//     offset: ["start 0.85", "end 0.35"],
//   });

//   const words = text.trim().split(/\s+/);

//   // Accessibility: skip the scroll-linked effect entirely if the user prefers reduced motion
//   if (prefersReducedMotion) {
//     return (
//       <section className="py-24">
//         <p
//           className={`mx-auto max-w-4xl px-6 text-center text-3xl font-semibold leading-snug text-foreground md:text-5xl ${className}`}
//         >
//           {text}
//         </p>
//       </section>
//     );
//   }

//   return (
//     <section ref={container} className="relative min-h-[160vh]">
//       <div className="sticky top-0 flex h-screen items-center justify-center px-6">
//         <p
//           className={`mx-auto max-w-4xl text-center text-3xl font-semibold leading-snug tracking-tight text-foreground md:text-5xl ${className}`}
//         >
//           {words.map((word, i) => {
//             const start = i / words.length;
//             const end = start + 1 / words.length;
//             return (
//               <Word key={i} range={[start, end]} progress={scrollYProgress}>
//                 {word}
//               </Word>
//             );
//           })}
//         </p>
//       </div>
//     </section>
//   );
// }
// src/app/dashboard/gadgets/new/page.tsx
import Link from "next/link";
import { ArrowLeft, PackagePlus } from "lucide-react";
import GadgetProductForm from "@/components/gadgets/GadgetProductForm";

export default function NewGadgetPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/gadgets"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Gadgets
      </Link>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        <div className="h-1 bg-blue-500" />
        <div className="p-5 sm:p-6 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
            <PackagePlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1
              className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Add gadget
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Add a new product to the comparison catalog.
            </p>
          </div>
        </div>
      </div>

      <GadgetProductForm mode="create" />
    </div>
  );
}
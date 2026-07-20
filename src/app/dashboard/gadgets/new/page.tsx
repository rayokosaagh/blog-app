// src/app/dashboard/gadgets/new/page.tsx
import { PackagePlus } from "lucide-react";
import GadgetProductForm from "@/components/gadgets/GadgetProductForm";
import BackLink from "@/components/dashboard/BackLink";

export default function NewGadgetPage() {
  return (
    <div className="space-y-6">
      <BackLink href="/dashboard/gadgets" label="Gadgets" />

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
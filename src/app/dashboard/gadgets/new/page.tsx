// src/app/dashboard/gadgets/new/page.tsx
import GadgetProductForm from "@/components/gadgets/GadgetProductForm";

export default function NewGadgetPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Add Gadget</h1>
      <GadgetProductForm mode="create" />
    </div>
  );
}
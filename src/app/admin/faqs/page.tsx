import { getLiveSiteData } from "@/lib/data-fetcher";
import { FaqManager } from "@/components/admin/FaqManager";
import { AdminSavePublishBar } from "@/components/admin/AdminSavePublishBar";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  const { faqs } = await getLiveSiteData();
  const activeFaq = faqs.find((f) => f.is_active) ?? faqs[0];
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">AEO Entity Dossier</h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        FAQs render on the homepage dossier, in the FAQPage JSON-LD schema, and in /llms-full.txt — all at once.
      </p>
      <FaqManager faqs={faqs} />
      <AdminSavePublishBar section="faqs" label="FAQs" expected={activeFaq?.question ?? null} />
    </div>
  );
}

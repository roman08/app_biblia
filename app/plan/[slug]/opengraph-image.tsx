import { getPlanBySlug } from "@/lib/supabase/plans-actions";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og/og-card";
import { truncate } from "@/lib/site";

export const alt = "Plan de lectura de la Biblia";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPlanBySlug(slug).catch(() => null);
  const plan = result?.plan;

  return renderOgCard({
    eyebrow: "Plan de lectura",
    title: plan?.name ?? "Planes de lectura",
    body: plan?.description ? truncate(plan.description, 140) : undefined,
    footer: plan ? `${plan.total_days} días` : undefined,
  });
}

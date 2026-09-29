import Link from "next/link";
import { getAllPlans } from "@/lib/supabase/plans-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookMarked } from "lucide-react";

export default async function PlanesPage() {
  const plans = await getAllPlans();

  return (
  <div className="container mx-auto max-w-3xl px-4 py-6 sm:py-8">
    <h1 className="text-2xl font-bold mb-1 sm:text-3xl">Planes de lectura</h1>
    <p className="text-sm text-muted-foreground mb-6">
      Elige un plan y empieza a leer con propósito
    </p>

    {plans.length === 0 ? (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No hay planes disponibles todavía
        </CardContent>
      </Card>
    ) : (
      <div className="grid gap-3 sm:gap-4">
        {plans.map((plan) => (
          <Link key={plan.id} href={`/plan/${plan.slug}`} className="block">
            <Card className="transition-colors hover:bg-muted/50 active:scale-[0.99]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BookMarked className="h-5 w-5 text-primary shrink-0" />
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {plan.total_days} días
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    )}
  </div>
);
}
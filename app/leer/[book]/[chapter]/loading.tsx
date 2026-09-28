import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-28" />
        </div>

        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Título del capítulo */}
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Versículos simulados */}
      <div className="space-y-5">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton
              className="h-5"
              style={{ width: `${70 + Math.random() * 30}%` }}
            />
            {i % 3 === 0 && (
              <Skeleton
                className="h-5"
                style={{ width: `${50 + Math.random() * 40}%` }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Navegación inferior */}
      <div className="mt-12 flex items-center justify-between gap-4 border-t pt-6">
        <Skeleton className="h-14 w-40" />
        <Skeleton className="h-14 w-40" />
      </div>
    </div>
  );
}
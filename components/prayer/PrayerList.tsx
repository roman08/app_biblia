"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, HandHeart, Plus, RotateCcw, Trash2 } from "lucide-react";
import {
  createPrayer,
  deletePrayer,
  markPrayerAnswered,
  reopenPrayer,
  type ActionResult,
  type PrayerRequest,
} from "@/lib/supabase/prayer-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PrayerListProps {
  prayers: PrayerRequest[];
  /** Zona horaria del usuario, para mostrar fechas */
  timeZone: string;
  /** Hoy en la hora local del usuario (YYYY-MM-DD) */
  today: string;
}

/** Ejecuta una server action y avisa si falla (p. ej. sin conexión) */
async function run(action: () => Promise<ActionResult>) {
  try {
    const result = await action();
    if (!result.ok) toast.error(result.error);
    return result.ok;
  } catch {
    toast.error(navigator.onLine ? "No se pudo guardar. Intenta de nuevo." : "Sin conexión. Intenta cuando vuelva la red.");
    return false;
  }
}

export function PrayerList({ prayers, timeZone, today }: PrayerListProps) {
  const active = prayers.filter((p) => !p.answered_at);
  const answered = prayers
    .filter((p) => p.answered_at)
    .sort((a, b) => b.answered_at!.localeCompare(a.answered_at!));

  const dateFmt = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone });
  const localDay = (iso: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
  const daysBetween = (fromIso: string, toIso: string) =>
    Math.round((Date.parse(localDay(toIso)) - Date.parse(localDay(fromIso))) / 86_400_000);
  const thisYear = today.slice(0, 4);
  const answeredThisYear = answered.filter((p) => localDay(p.answered_at!).startsWith(thisYear)).length;

  return (
    <div className="space-y-6">
      <NewPrayerForm />

      <Tabs defaultValue="activas" className="space-y-4">
        <TabsList className="w-full">
          <TabsTrigger value="activas" className="flex-1">
            Activas ({active.length})
          </TabsTrigger>
          <TabsTrigger value="respondidas" className="flex-1">
            Respondidas ({answered.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activas" className="space-y-3">
          {active.length === 0 ? (
            <EmptyState text="No tienes peticiones activas. Escribe arriba por quién o por qué quieres orar." />
          ) : (
            active.map((p) => (
              <ActivePrayer
                key={p.id}
                prayer={p}
                since={`Desde el ${dateFmt.format(new Date(p.created_at))}`}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="respondidas" className="space-y-3">
          {answered.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {answeredThisYear === 0
                ? "Ninguna respondida este año todavía."
                : `${answeredThisYear} ${answeredThisYear === 1 ? "oración respondida" : "oraciones respondidas"} este año.`}
            </p>
          )}
          {answered.length === 0 ? (
            <EmptyState text="Cuando Dios responda una petición, márcala como respondida y quedará aquí para recordarlo." />
          ) : (
            answered.map((p) => {
              const days = daysBetween(p.created_at, p.answered_at!);
              return (
                <AnsweredPrayer
                  key={p.id}
                  prayer={p}
                  when={`Respondida el ${dateFmt.format(new Date(p.answered_at!))}${
                    days > 0 ? ` · después de ${days} ${days === 1 ? "día" : "días"}` : ""
                  }`}
                />
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      <HandHeart className="mx-auto mb-2 h-6 w-6" aria-hidden="true" />
      {text}
    </div>
  );
}

function NewPrayerForm() {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      if (await run(() => createPrayer(title, details))) {
        setTitle("");
        setDetails("");
        setShowDetails(false);
        toast.success("Petición agregada");
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          id="prayer-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nueva petición…"
          aria-label="Nueva petición de oración"
          maxLength={200}
          className="h-11"
        />
        <Button type="submit" className="h-11 shrink-0 gap-1.5" disabled={isPending || !title.trim()}>
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>
      {showDetails ? (
        <Textarea
          id="prayer-details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Detalles (opcional)"
          aria-label="Detalles de la petición"
          maxLength={5000}
          rows={3}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowDetails(true)}
          className="min-h-11 text-sm text-primary hover:underline"
        >
          + Agregar detalles
        </button>
      )}
    </form>
  );
}

function DeleteButton({ id, title }: { id: string; title: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 text-muted-foreground"
        onClick={() => setConfirming(true)}
        aria-label={`Eliminar «${title}»`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Confirmar eliminación">
      <span className="text-xs text-muted-foreground">¿Eliminar?</span>
      <Button
        variant="destructive"
        size="sm"
        className="h-9"
        disabled={isPending}
        onClick={() => startTransition(async () => void (await run(() => deletePrayer(id))))}
      >
        Sí
      </Button>
      <Button variant="ghost" size="sm" className="h-9" onClick={() => setConfirming(false)}>
        No
      </Button>
    </div>
  );
}

function ActivePrayer({ prayer, since }: { prayer: PrayerRequest; since: string }) {
  const [answering, setAnswering] = useState(false);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const confirmAnswered = () =>
    startTransition(async () => {
      if (await run(() => markPrayerAnswered(prayer.id, note))) toast.success("¡Gloria a Dios! Movida a respondidas");
    });

  return (
    <Card className={isPending ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <CardContent className="space-y-3 p-4">
        <div>
          <p className="font-medium">{prayer.title}</p>
          {prayer.details && (
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{prayer.details}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{since}</p>
        </div>

        {answering ? (
          <div className="space-y-2">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="¿Cómo respondió Dios? (opcional)"
              aria-label="Cómo respondió Dios"
              maxLength={5000}
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" className="h-10" onClick={() => setAnswering(false)}>
                Cancelar
              </Button>
              <Button size="sm" className="h-10 gap-1.5" onClick={confirmAnswered} disabled={isPending}>
                <Check className="h-4 w-4" />
                Guardar como respondida
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" className="h-10 gap-1.5" onClick={() => setAnswering(true)}>
              <Check className="h-4 w-4" />
              Respondida
            </Button>
            <DeleteButton id={prayer.id} title={prayer.title} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnsweredPrayer({ prayer, when }: { prayer: PrayerRequest; when: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Card className={isPending ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <CardContent className="space-y-3 p-4">
        <div>
          <p className="flex items-start gap-2 font-medium">
            <Check className="mt-1 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            {prayer.title}
          </p>
          {prayer.answer_note && (
            <p className="mt-2 whitespace-pre-line border-l-2 border-success/40 pl-3 font-serif text-sm italic">
              {prayer.answer_note}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{when}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 gap-1.5 text-muted-foreground"
            disabled={isPending}
            onClick={() => startTransition(async () => void (await run(() => reopenPrayer(prayer.id))))}
          >
            <RotateCcw className="h-4 w-4" />
            Volver a activas
          </Button>
          <DeleteButton id={prayer.id} title={prayer.title} />
        </div>
      </CardContent>
    </Card>
  );
}

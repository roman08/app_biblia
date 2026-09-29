"use client";

import { useSyncExternalStore } from "react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

const subscribe = () => () => {};

// El saludo depende de la hora local del usuario; en el servidor (UTC en
// Vercel) sería incorrecto, así que solo se calcula en el cliente.
export function Greeting() {
  const greeting = useSyncExternalStore(subscribe, getGreeting, () => null);

  return <h1 className="text-3xl font-bold">{greeting ?? " "}</h1>;
}

"use client";

import { useEffect, useState } from "react";

export default function MenuDisplay() {
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMenu() {
      try {
        const response = await fetch("/api/menu", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("No se pudo cargar el menú.");

        const datos: { name: string } = await response.json();
        if (!controller.signal.aborted) setRestaurantName(datos.name);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    }

    void loadMenu();
    return () => controller.abort();
  }, []);

  if (error) return <p role="alert">No se pudo cargar el menú.</p>;
  if (restaurantName === null) return <p>Cargando menú...</p>;

  return <p>Menú cargado: {restaurantName}</p>;
}

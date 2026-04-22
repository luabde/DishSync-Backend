type NominatimResult = {
  lat: string;
  lon: string;
};

/**
 * ¿Qué hace esta función?
 * - Recibe una dirección en texto ("Carrer X, Barcelona")
 * - Llama al servicio Nominatim para convertir esa dirección en coordenadas
 * - Devuelve { lat, lng } si encuentra resultado
 * - Devuelve null si no encuentra o si hay error
 *
 * ¿Qué es Nominatim?
 * - Es un servicio de geocodificación basado en datos de OpenStreetMap.
 * - OpenStreetMap es el "mapa"; Nominatim es el servicio que "traduce"
 *   direcciones de texto a coordenadas.
 */
export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  // 1) Limpiamos espacios al inicio/final.
  // Ejemplo: "  Plaça Catalunya  " -> "Plaça Catalunya"
  const normalizedAddress = address.trim();

  // Si no queda texto útil, no hacemos llamada HTTP.
  if (!normalizedAddress) return null;

  // 2) Construimos la URL base de Nominatim para búsquedas.
  const url = new URL("https://nominatim.openstreetmap.org/search");

  // 3) Añadimos query params (parámetros en la URL).
  // URLSearchParams evita concatenar strings "a mano" y codifica caracteres especiales.
  //
  // q      -> texto de búsqueda (la dirección)
  // format -> queremos respuesta JSON
  // limit  -> solo nos interesa la mejor coincidencia (1 resultado)
  //
  // Resultado final ejemplo:
  // https://nominatim.openstreetmap.org/search?q=Plaza+de+Cataluna+Barcelona&format=json&limit=1
  url.searchParams.set("q", normalizedAddress);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  // 4) Cabecera User-Agent.
  // Muchos servicios HTTP la usan para saber quién hace la petición.
  // Nominatim pide explícitamente que te identifiques con una app y un contacto.
  const userAgent = process.env.OSM_USER_AGENT || "DishSync/1.0 (support@dishsync.local)";

  // 5) Hacemos la petición HTTP GET.
  const response = await fetch(url.toString(), {
    headers: {
      // Identifica la aplicaion ante Nominatim.
      "User-Agent": userAgent,
      // Ayuda a que los textos de dirección devueltos prioricen español.
      "Accept-Language": "es",
    },
  });

  // 6) Si HTTP falla, devolvemos null.
  // Así no rompemos la creación/edición del restaurante.
  if (!response.ok) {
    return null;
  }

  // 7) Parseamos respuesta JSON esperada como array de resultados.
  const data = (await response.json()) as NominatimResult[];

  // Si no hay resultados, la dirección no se pudo ubicar.
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  // 8) Nominatim devuelve lat/lon como string; convertimos a number.
  const lat = Number.parseFloat(data[0].lat);
  const lng = Number.parseFloat(data[0].lon);

  // Si por cualquier motivo no son válidos, devolvemos null.
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  // 9) Coordenadas listas para guardar en base de datos y pintar en mapa.
  return { lat, lng };
};

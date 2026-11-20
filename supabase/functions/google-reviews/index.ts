// Real Google reviews for the website (Places API, New). Cached for 6 hours per instance.
// Secrets: GOOGLE_PLACES_KEY, GOOGLE_PLACE_ID (find it with Google's Place ID Finder)
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
let cache: { at: number; body: string } | null = null;
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (cache && Date.now() - cache.at < 6 * 3600_000) return new Response(cache.body, { headers: { ...cors, "Content-Type": "application/json" } });
  const r = await fetch(`https://places.googleapis.com/v1/places/${Deno.env.get("GOOGLE_PLACE_ID")}?languageCode=en`, {
    headers: { "X-Goog-Api-Key": Deno.env.get("GOOGLE_PLACES_KEY")!, "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri" }
  });
  if (!r.ok) return new Response("null", { headers: { ...cors, "Content-Type": "application/json" } });
  const p = await r.json();
  const body = JSON.stringify({
    rating: p.rating || 0, count: p.userRatingCount || 0, url: p.googleMapsUri,
    reviews: (p.reviews || []).filter((x: any) => x.rating >= 4 && x.text?.text).map((x: any) => ({ author: x.authorAttribution?.displayName || "Google user", rating: x.rating, text: x.text.text, when: x.relativePublishTimeDescription || "" }))
  });
  cache = { at: Date.now(), body };
  return new Response(body, { headers: { ...cors, "Content-Type": "application/json" } });
});

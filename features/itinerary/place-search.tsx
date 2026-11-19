"use client";

import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";

import type { Place } from "./types";

type Suggestion = { prediction: google.maps.places.PlacePrediction; main: string; sub: string };

// 구글 장소 자동완성(Places API New). 고르면 이름과 좌표를 돌려준다.
export function PlaceSearch({ value, onChange }: { value: Place | null; onChange: (place: Place | null) => void }) {
  const places = useMapsLibrary("places");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!places || !q) return;
    tokenRef.current ??= new places.AutocompleteSessionToken();
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: q,
          sessionToken: tokenRef.current!,
          language: "ko",
        });
        if (cancelled) return;
        setError(null);
        setSuggestions(
          suggestions.flatMap((s) =>
            s.placePrediction
              ? [{ prediction: s.placePrediction, main: s.placePrediction.mainText?.text ?? s.placePrediction.text.text, sub: s.placePrediction.secondaryText?.text ?? "" }]
              : [],
          ),
        );
      } catch {
        if (!cancelled) setError("장소를 검색하지 못했습니다.");
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [places, query]);

  const pick = async (s: Suggestion) => {
    const place = s.prediction.toPlace();
    await place.fetchFields({ fields: ["displayName", "location"] });
    tokenRef.current = null;
    if (!place.location) return;
    onChange({ placeId: place.id, name: place.displayName ?? s.main, lat: place.location.lat(), lng: place.location.lng() });
    setQuery("");
    setSuggestions(null);
  };

  if (value) {
    return (
      <span className="inline-flex max-w-full items-center gap-2 justify-self-start rounded-full bg-muted py-1.5 pl-3 pr-2 text-sm">
        <span className="truncate">📍 {value.name}</span>
        <button type="button" aria-label="장소 빼기" onClick={() => onChange(null)} className="text-muted-foreground">
          <XIcon className="size-4" />
        </button>
      </span>
    );
  }

  return (
    <div className="grid gap-1">
      <Input
        id="item-place"
        placeholder="장소 이름을 검색하세요 (예: Lake Kinrin)"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query.trim() && suggestions && (
        <ul className="rounded-2xl bg-popover p-1 shadow-md ring-1 ring-foreground/10">
          {suggestions.length ? (
            suggestions.map((s) => (
              <li key={s.prediction.placeId}>
                <button type="button" onClick={() => pick(s)} className="w-full rounded-xl px-2.5 py-2 text-left text-sm hover:bg-muted">
                  {s.main}
                  {s.sub && <small className="block text-xs text-muted-foreground">{s.sub}</small>}
                </button>
              </li>
            ))
          ) : (
            <li className="px-2.5 py-2 text-sm text-muted-foreground">검색 결과가 없습니다</li>
          )}
        </ul>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

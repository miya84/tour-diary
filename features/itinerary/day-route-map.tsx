"use client";

import { AdvancedMarker, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

type Point = { id: string; lat: number; lng: number; number: number };

const PRIMARY = "oklch(0.488 0.243 264.376)";

// 하루 동선: 번호 핀을 목록 순서대로 직선으로 잇고, 핀이 모두 보이게 지도를 맞춘다.
export function DayRouteMap({ points }: { points: Point[] }) {
  if (!points.length) {
    return (
      <div className="flex aspect-4/3 w-full flex-col items-center justify-center gap-1.5 rounded-2xl bg-muted px-5 text-center text-sm text-muted-foreground">
        <b className="text-[15px] font-semibold text-foreground">지도에 표시할 장소가 없습니다</b>
        <span>일정에 장소를 추가하면 하루 동선이 여기에 그려집니다.</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl ring-1 ring-foreground/10">
      <Map
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"}
        defaultCenter={{ lat: points[0].lat, lng: points[0].lng }}
        defaultZoom={14}
        gestureHandling="greedy"
        disableDefaultUI
        className="size-full"
      >
        {points.map((p) => (
          <AdvancedMarker key={p.id} position={{ lat: p.lat, lng: p.lng }} title={`${p.number}`}>
            <span
              className="grid size-7 place-items-center rounded-full border-2 border-white text-xs font-semibold text-white shadow"
              style={{ background: PRIMARY }}
            >
              {p.number}
            </span>
          </AdvancedMarker>
        ))}
        <RouteLine points={points} />
        <FitBounds points={points} />
      </Map>
      <span className="absolute left-2.5 top-2.5 rounded-full bg-card px-2.5 py-1 text-xs font-medium ring-1 ring-foreground/10">
        핀 {points.length}곳{points.length > 1 ? " · 순서대로 연결" : ""}
      </span>
    </div>
  );
}

function RouteLine({ points }: { points: Point[] }) {
  const map = useMap();
  const maps = useMapsLibrary("maps");

  useEffect(() => {
    if (!map || !maps || points.length < 2) return;
    const line = new maps.Polyline({
      map,
      path: points.map((p) => ({ lat: p.lat, lng: p.lng })),
      strokeColor: "#2f54eb",
      strokeOpacity: 0.85,
      strokeWeight: 4,
    });
    return () => line.setMap(null);
  }, [map, maps, points]);

  return null;
}

function FitBounds({ points }: { points: Point[] }) {
  const map = useMap();
  const core = useMapsLibrary("core");

  useEffect(() => {
    if (!map || !core) return;
    if (points.length === 1) {
      map.setCenter({ lat: points[0].lat, lng: points[0].lng });
      map.setZoom(15);
      return;
    }
    const bounds = new core.LatLngBounds();
    points.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    map.fitBounds(bounds, 48);
  }, [map, core, points]);

  return null;
}

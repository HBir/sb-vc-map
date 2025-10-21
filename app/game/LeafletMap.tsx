"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useMemo, type ComponentType } from "react";
import L from "leaflet";

type Props = {
  center?: { lat: number; lng: number } | null;
  completed?: { lat: number; lng: number }[];
  tasks?: { lat: number; lng: number; index: number }[];
  showDebugIndices?: boolean;
};

export default function MapView({ center, completed, tasks, showDebugIndices }: Props) {


  const mapCenter = useMemo(() => center ?? { lat: 55.605, lng: 13.0 }, [center]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const RLMapContainer = MapContainer as unknown as ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const RLTileLayer = TileLayer as unknown as ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const RLMarker = Marker as unknown as ComponentType<any>;

  // Use a dedicated custom icon to control sizing/anchors precisely
  const markerIcon = useMemo(
    () => L.icon({
      iconUrl: "/game-template/marker-icon2.png",
      iconRetinaUrl: "/game-template/marker-icon2.png",
      iconSize: [36, 36], // width, height in px – adjust to your asset
      iconAnchor: [18, 36], // point of the icon which will correspond to marker's location
      popupAnchor: [0, -32], // where popups open relative to the iconAnchor
      className: "custom-leaflet-marker",
    }),
    [],
  );

  const completedIcon = useMemo(
    () => L.icon({
      iconUrl: "/game-template/marker-check.png",
      iconRetinaUrl: "/game-template/marker-check.png",
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      className: "completed-leaflet-marker",
    }),
    [],
  );

  const numberIcon = (n: number) =>
    L.divIcon({
      className: "task-index-marker",
      html: `<div style="color:black;background:white;border:1px solid #aaa;border-radius:4px;padding:2px 6px;font-size:12px;font-weight:600;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.2)">${n}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

  return (
    <div className="h-64 w-full overflow-hidden rounded-md border">
      <RLMapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={16} scrollWheelZoom={false}
        className="h-full w-full"
      >
        <RLTileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {center && <RLMarker position={[center.lat, center.lng]} icon={markerIcon} />}
        {completed?.map((p, idx) => (
          <RLMarker key={`c-${idx}`} position={[p.lat, p.lng]} icon={completedIcon} />
        ))}
        {showDebugIndices && tasks?.map((t) => (
          <RLMarker key={`t-${t.index}`} position={[t.lat, t.lng]} icon={numberIcon(t.index + 1)} />
        ))}
      </RLMapContainer>
    </div>
  );
}



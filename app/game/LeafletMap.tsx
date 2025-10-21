"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import { useMemo } from "react";

type Props = {
  center?: { lat: number; lng: number } | null;
  target?: { lat: number; lng: number } | null;
};

export default function LeafletMap({ center, target }: Props) {
  const mapCenter = useMemo(() => center ?? { lat: 55.605, lng: 13.0 }, [center]);

  return (
    <div className="h-64 w-full overflow-hidden rounded-md border">
      <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={16} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {center && <Marker position={[center.lat, center.lng]} />}
        {target && (
          <Circle center={[target.lat, target.lng]} radius={100} pathOptions={{ color: "#22c55e", fillOpacity: 0.1 }} />
        )}
      </MapContainer>
    </div>
  );
}



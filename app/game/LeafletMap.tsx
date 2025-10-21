"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";

type Props = {
  center?: { lat: number; lng: number } | null;
  target?: { lat: number; lng: number } | null;
};

export default function MapView({ center, target }: Props) {

  return (
    <div className="h-64 w-full overflow-hidden rounded-md border">
      <MapContainer className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {center && <Marker position={[center.lat, center.lng]} />}
        {target && (
          <Circle center={[target.lat, target.lng]}  pathOptions={{ color: "#22c55e", fillOpacity: 0.1 }} />
        )}
      </MapContainer>
    </div>
  );
}



"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useMemo, type ComponentType } from "react";

type Props = {
  center?: { lat: number; lng: number } | null;
  target?: { lat: number; lng: number } | null;
};

export default function MapView({ center }: Props) {
  const mapCenter = useMemo(() => center ?? { lat: 55.605, lng: 13.0 }, [center]);

  // React-Leaflet v5 types + React 19 can confuse TS in some setups.
  // Cast components to a generic component type to satisfy the linter while keeping runtime behavior.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const RLMapContainer = MapContainer as unknown as ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const RLTileLayer = TileLayer as unknown as ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const RLMarker = Marker as unknown as ComponentType<any>;

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
        {center && <RLMarker position={[center.lat, center.lng]} />}
      </RLMapContainer>
    </div>
  );
}



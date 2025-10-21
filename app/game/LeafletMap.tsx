"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useMemo, type ComponentType } from "react";
import L from "leaflet";

type Props = {
  center?: { lat: number; lng: number } | null;
  target?: { lat: number; lng: number } | null;
};

export default function MapView({ center }: Props) {
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
      </RLMapContainer>
    </div>
  );
}



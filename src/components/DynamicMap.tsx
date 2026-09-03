"use client";
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Custom component to handle flyTo map animation with offset
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (map && typeof map.flyTo === 'function') {
      const mapHeight = map.getSize().y;
      // Position marker near the bottom (60px from bottom edge) to leave max room for the popup above it
      const offsetY = (mapHeight / 2) - 60;
      
      const targetPoint = map.project(center, zoom);
      targetPoint.y -= offsetY; 
      const targetLatLng = map.unproject(targetPoint, zoom);
      
      map.flyTo(targetLatLng, zoom, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  }, [center, zoom, map]);
  return null;
}

export default function DynamicMap({ 
  locations, 
  mapCenter, 
  mapZoom, 
  handleBranchSelect 
}: { 
  locations: any[], 
  mapCenter: [number, number], 
  mapZoom: number, 
  handleBranchSelect: (loc: any) => void 
}) {
  const [L, setL] = useState<any>(null);
  const [customIcon, setCustomIcon] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      const icon = new leaflet.Icon({
        iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f97316"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });
      setCustomIcon(icon);
      setL(leaflet);
    });
  }, []);

  if (!L || !customIcon) return null;

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={mapZoom} 
      style={{ height: "100%", width: "100%", background: "#1a1a1a" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="dark-map-tiles"
      />
      <MapController center={mapCenter} zoom={mapZoom} />
      
      {locations.map((loc) => (
        <Marker 
          key={loc.id || loc.name} 
          position={[loc.latitude, loc.longitude]}
          icon={customIcon}
          eventHandlers={{
            click: () => handleBranchSelect(loc),
          }}
        >
          <Popup className="custom-popup">
            <div style={{ minWidth: "250px", paddingBottom: "1.2rem" }}>
              {loc.image && (
                <img 
                  src={loc.image} 
                  alt={loc.name} 
                  style={{ width: "100%", height: "140px", objectFit: "cover", borderTopLeftRadius: "12px", borderTopRightRadius: "12px", marginBottom: "1rem" }} 
                />
              )}
              <div style={{ padding: "0 1.2rem", paddingTop: loc.image ? "0" : "1.8rem" }}>
                <h4 style={{ color: "var(--primary)", margin: "0 0 0.5rem 0", fontSize: "1.2rem", fontWeight: "bold" }}>{loc.name}</h4>
                <p style={{ color: "#333", fontSize: "0.95rem", margin: "0 0 1rem 0", lineHeight: "1.4" }}>{loc.address}</p>
                
                {loc.timings && <p style={{ fontSize: "0.85rem", margin: "0 0 0.5rem 0", color: "#555" }}><strong>Timings:</strong> {loc.timings}</p>}
                {loc.phone && <p style={{ fontSize: "0.85rem", margin: "0 0 0.5rem 0", color: "#555" }}><strong>Phone:</strong> {loc.phone}</p>}
                {loc.programs && <p style={{ fontSize: "0.85rem", margin: "0 0 1rem 0", color: "#555" }}><strong>Programs:</strong> {loc.programs}</p>}
                
                <a 
                  href={loc.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: "block", padding: "0.8rem", background: "var(--primary)", color: "#000", borderRadius: "6px", textAlign: "center", textDecoration: "none", fontWeight: "bold", fontSize: "0.95rem", marginTop: "1rem" }}
                >
                  Get Directions
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

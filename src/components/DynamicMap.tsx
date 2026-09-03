"use client";
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Custom component to handle flyTo map animation
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (map && typeof map.flyTo === 'function') {
      const mapHeight = map.getSize().y;
      const offsetY = (mapHeight / 2) - 60;
      
      const targetPoint = map.project(center, zoom);
      targetPoint.y -= offsetY; 
      const targetLatLng = map.unproject(targetPoint, zoom);
      
      map.flyTo(targetLatLng, zoom, {
        duration: 1.2,
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
      // Premium Red & Gold Custom Marker Icon
      const icon = new leaflet.Icon({
        iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 48"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%25" stop-color="%23ff2e2e"/><stop offset="100%25" stop-color="%23990000"/></linearGradient><filter id="s" x="-20%25" y="-20%25" width="140%25" height="140%25"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="%23ff2e2e" flood-opacity="0.6"/></filter></defs><path d="M19 2C9.6 2 2 9.6 2 19c0 12.8 17 27 17 27s17-14.2 17-27C36 9.6 28.4 2 19 2z" fill="url(%23g)" filter="url(%23s)" stroke="%23ffd700" stroke-width="1.5"/><circle cx="19" cy="19" r="8" fill="%23ffffff"/><circle cx="19" cy="19" r="5" fill="%23ff2e2e"/></svg>',
        iconSize: [38, 48],
        iconAnchor: [19, 48],
        popupAnchor: [0, -48]
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
      style={{ height: "100%", width: "100%", background: "#0a0a0c" }}
      zoomControl={false}
      attributionControl={false}
    >
      {/* CartoDB Dark Matter Tile Layer - High End Native Dark Mode Map */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        maxZoom={19}
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
            <div style={{ minWidth: "250px", background: "#0d0d0f", color: "#fff", borderRadius: "14px", overflow: "hidden" }}>
              {loc.image && (
                <img 
                  src={loc.image} 
                  alt={loc.name} 
                  style={{ width: "100%", height: "130px", objectFit: "cover" }} 
                />
              )}
              <div style={{ padding: "1rem" }}>
                <h4 style={{ color: "#ef4444", margin: "0 0 0.4rem 0", fontSize: "1.1rem", fontWeight: "700" }}>{loc.name}</h4>
                <p style={{ color: "#d4d4d8", fontSize: "0.85rem", margin: "0 0 0.8rem 0", lineHeight: "1.4" }}>{loc.address}</p>
                
                {loc.timings && <p style={{ fontSize: "0.8rem", margin: "0 0 0.3rem 0", color: "#a1a1aa" }}><strong>Timings:</strong> {loc.timings}</p>}
                {loc.phone && <p style={{ fontSize: "0.8rem", margin: "0 0 0.3rem 0", color: "#a1a1aa" }}><strong>Phone:</strong> {loc.phone}</p>}
                
                <a 
                  href={loc.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: "block", 
                    padding: "0.65rem", 
                    background: "linear-gradient(135deg, #ef4444, #b91c1c)", 
                    color: "#fff", 
                    borderRadius: "8px", 
                    textAlign: "center", 
                    textDecoration: "none", 
                    fontWeight: "bold", 
                    fontSize: "0.88rem", 
                    marginTop: "0.8rem",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)"
                  }}
                >
                  Get Directions →
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

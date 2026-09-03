"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const defaultLocations = [
  {
    id: "loc-telco",
    name: "Telco Colony",
    address: "Telco Colony, Shani Nagar, Ambegaon Budruk, Pune, Maharashtra 411046",
    city: "Pune",
    googleMapsUrl: "https://maps.app.goo.gl/73VSvHFejtk61pPM6?g_st=awb",
    latitude: 18.4539,
    longitude: 73.8373,
    isActive: true,
  },
  {
    id: "loc-karve",
    name: "Karvenagar",
    address: "Karvenagar, Pune, Maharashtra",
    city: "Pune",
    googleMapsUrl: "https://maps.app.goo.gl/DU7V1mZnAwjWyRKJ8?g_st=awb",
    latitude: 18.4907,
    longitude: 73.8188,
    isActive: true,
  },
  {
    id: "loc-hadapsar",
    name: "Hadapsar Bhosale Nagar",
    address: "Bhosale Nagar, Hadapsar, Pune, Maharashtra 411028",
    city: "Pune",
    googleMapsUrl: "https://maps.app.goo.gl/aVdBvByNibNTBkMn7?g_st=awb",
    latitude: 18.5089,
    longitude: 73.9260,
    isActive: true,
  },
  {
    id: "loc-siddhi",
    name: "Siddhivinayak Society",
    address: "Siddhivinayak Society, Pune",
    city: "Pune",
    googleMapsUrl: "https://maps.app.goo.gl/U9ZG4AWhHawuRBJo6?g_st=awb",
    latitude: 18.5204,
    longitude: 73.8567,
    isActive: true,
  }
];

// Dynamic import for Map to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

export default function MapEditorPage() {
  const [locations, setLocations] = useState<any[]>(defaultLocations);
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);
  const [customIcon, setCustomIcon] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
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
    
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/admin/map-locations");
      if (res.ok) {
        const data: any = await res.json();
        if (Array.isArray(data)) {
          const valid = data.filter((l: any) => l.latitude && l.longitude);
          if (valid.length > 0) {
            setLocations(valid);
            return;
          }
        }
      }
    } catch (e) {
      console.error("Map locations fetch error, using defaults", e);
    }
    setLocations(defaultLocations);
  };

  const center: [number, number] = [18.5204, 73.8567]; // Default Pune

  if (!mounted || !L || !customIcon) return <div style={{ color: "#fff", padding: "2rem" }}>Loading map...</div>;

  return (
    <div style={{ padding: "2rem", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ color: "var(--primary)", margin: 0 }}>Map Editor</h1>
        <a href="/admin/map-branches" style={{ color: "#aaa", textDecoration: "none" }}>&larr; Back to Branches</a>
      </div>
      <p style={{ marginBottom: "1rem" }}>Preview marker locations on the live map.</p>

      <div style={{ flex: 1, borderRadius: "8px", overflow: "hidden", border: "2px solid #333" }}>
        <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {locations.map((loc) => (
            <Marker key={loc.id || loc.name} position={[loc.latitude, loc.longitude]} icon={customIcon}>
              <Popup>
                <div style={{ color: "#000", minWidth: "200px" }}>
                  {loc.image && (
                    <img src={loc.image} alt={loc.name} style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "4px", marginBottom: "0.5rem" }} />
                  )}
                  <strong>{loc.name}</strong><br/>
                  <span style={{ fontSize: "0.9rem" }}>{loc.address}</span><br/>
                  <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <a href={`/admin/map-branches/edit/${loc.id}`} target="_parent" style={{ color: "blue", textDecoration: "underline", fontSize: "0.9rem" }}>Edit Details</a>
                    
                    <label style={{ cursor: "pointer", background: "#f97316", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "0.8rem", marginLeft: "auto" }}>
                      Upload Photo
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: "none" }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          const data = new FormData();
                          data.append("file", file);
                          
                          try {
                            const res = await fetch("/api/upload", { method: "POST", body: data });
                            if (res.ok) {
                              const json = await res.json();
                              // Update branch with new image
                              await fetch(`/api/admin/map-locations/${loc.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...loc, image: json.url })
                              });
                              fetchLocations(); // Refresh map data
                            } else {
                              alert("Upload failed");
                            }
                          } catch (err) {
                            alert("Error uploading");
                          }
                        }}
                      />
                    </label>
                    {loc.image && (
                      <button 
                        onClick={async () => {
                          if (confirm("Remove photo?")) {
                            try {
                              const res = await fetch(`/api/admin/map-locations/${loc.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...loc, image: "" })
                              });
                              if (res.ok) fetchLocations();
                            } catch (err) {}
                          }
                        }}
                        style={{ cursor: "pointer", background: "red", color: "#fff", border: "none", padding: "2px 6px", borderRadius: "4px", fontSize: "0.8rem" }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

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
  const [locations, setLocations] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    import("leaflet").then((leaflet) => {
      // Fix leaflet icon paths
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
      setL(leaflet);
    });
    
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/admin/map-locations");
      if (res.ok) {
        const data: any = await res.json();
        // Filter out those without coords
        setLocations(data.filter((l: any) => l.latitude && l.longitude));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const center = [18.5204, 73.8567]; // Default Pune

  if (!mounted || !L) return <div>Loading map...</div>;

  return (
    <div style={{ padding: "2rem", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ color: "var(--primary)", margin: 0 }}>Map Editor</h1>
        <a href="/admin/map-branches" style={{ color: "#aaa", textDecoration: "none" }}>&larr; Back to Branches</a>
      </div>
      <p style={{ marginBottom: "1rem" }}>Preview marker locations on the live map.</p>

      <div style={{ flex: 1, borderRadius: "8px", overflow: "hidden", border: "2px solid #333" }}>
        <MapContainer center={center as any} zoom={11} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {locations.map((loc) => (
            <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
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

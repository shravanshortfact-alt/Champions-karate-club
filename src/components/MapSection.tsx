"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const DynamicMap = dynamic(() => import("./DynamicMap"), { ssr: false });

export default function MapSection() {
  const [locations, setLocations] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([18.5204, 73.8567]);
  const [mapZoom, setMapZoom] = useState(11);
  const [activeLocId, setActiveLocId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("/api/map-locations");
        if (res.ok) {
          const data: any = await res.json();
          const validLocations = data.filter((l: any) => l.latitude && l.longitude);
          setLocations(validLocations);
        }
      } catch (err) {
        console.error("Failed to load map locations");
      }
    };
    fetchLocations();
  }, []);

  const handleBranchSelect = (loc: any) => {
    setMapCenter([loc.latitude, loc.longitude]);
    setMapZoom(15);
    setActiveLocId(loc.id || loc.name);
  };

  return (
    <section className="map-section" style={{ background: "#09090b", padding: "5rem 1rem", position: "relative" }}>
      <div className="container" style={{ maxWidth: "1100px", margin: "0 auto" }}>
        
        <div className="map-header" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 className="text-primary section-title" style={{ marginBottom: "0.8rem" }}>
            Find Your Nearest Branch
          </h2>
          <p style={{ color: "#a1a1aa", fontSize: "1rem", maxWidth: "600px", margin: "0 auto 1.5rem" }}>
            Train with Champions Karate Club at a location near you. Select a branch below or click on any map pin to view details.
          </p>

          {/* Quick Branch Selection Pills */}
          {locations.length > 0 && (
            <div style={{ 
              display: "flex", 
              gap: "0.8rem", 
              justifyContent: "center", 
              flexWrap: "wrap", 
              marginBottom: "2rem" 
            }}>
              {locations.map((loc) => {
                const isActive = activeLocId === (loc.id || loc.name);
                return (
                  <button
                    key={loc.id || loc.name}
                    type="button"
                    onClick={() => handleBranchSelect(loc)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.55rem 1.1rem",
                      borderRadius: "20px",
                      background: isActive ? "linear-gradient(135deg, #ef4444, #b91c1c)" : "#141417",
                      border: isActive ? "1px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.1)",
                      color: isActive ? "#ffffff" : "#d4d4d8",
                      fontSize: "0.88rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      boxShadow: isActive ? "0 4px 15px rgba(239, 68, 68, 0.35)" : "none"
                    }}
                  >
                    <MapPin size={15} color={isActive ? "#fff" : "#ef4444"} />
                    {loc.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="map-container" style={{ 
          width: "100%", 
          maxWidth: "1000px",
          margin: "0 auto",
          borderRadius: "20px", 
          overflow: "hidden", 
          border: "1px solid rgba(239, 68, 68, 0.4)", 
          position: "relative", 
          boxShadow: "0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(239, 68, 68, 0.15)" 
        }}>
          <DynamicMap 
            locations={locations} 
            mapCenter={mapCenter} 
            mapZoom={mapZoom} 
            handleBranchSelect={handleBranchSelect} 
          />
          
          <style dangerouslySetInnerHTML={{__html: `
            .dark-map-tiles {
              filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
            }
            /* Hide Leaflet OpenStreetMap Attribution Text ("ola street") */
            .leaflet-control-attribution {
              display: none !important;
            }
            .leaflet-container {
              background: #0a0a0c !important;
            }
            .map-container {
              height: 520px;
            }
            
            @media (max-width: 768px) {
              .map-section {
                padding: 3.5rem 0.8rem !important;
              }
              .map-container {
                height: 360px !important;
                border-radius: 14px !important;
              }
            }

            .custom-popup .leaflet-popup-content-wrapper {
              background: transparent !important;
              box-shadow: 0 10px 30px rgba(0,0,0,0.8) !important;
              padding: 0 !important;
              overflow: hidden !important;
            }
            .custom-popup .leaflet-popup-content {
              margin: 0 !important;
            }
            .custom-popup .leaflet-popup-close-button {
              top: 10px !important;
              right: 10px !important;
              color: #fff !important;
              background: rgba(0, 0, 0, 0.7) !important;
              border-radius: 50% !important;
              width: 26px !important;
              height: 26px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              z-index: 10 !important;
              font-size: 16px !important;
              padding: 0 !important;
            }
            .custom-popup .leaflet-popup-tip {
              background: #0d0d0f !important;
            }
          `}} />
        </div>
      </div>
    </section>
  );
}

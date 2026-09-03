"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("./DynamicMap"), { ssr: false });

export default function MapSection() {
  const [locations, setLocations] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([18.5204, 73.8567]);
  const [mapZoom, setMapZoom] = useState(11);

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
  };

  return (
    <section className="map-section" style={{ background: "var(--bg-main)", borderTop: "1px solid #222" }}>
      <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 0.5rem" }}>
        
        <div className="map-header" style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <h2 className="text-primary map-title" style={{ fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", lineHeight: "1.25" }}>
            Find Your Nearest Branch
          </h2>
          <p className="text-muted map-subtitle" style={{ margin: "0.5rem auto 0.75rem", color: "#a1a1aa" }}>
            Find Champions Karate Club dojos near you. Tap any map marker for branch details.
          </p>
          <div style={{ marginTop: "0.75rem" }}>
            <span style={{ 
              display: "inline-block", 
              background: "rgba(255, 46, 46, 0.12)", 
              color: "var(--primary)", 
              padding: "0.35rem 1rem", 
              borderRadius: "20px", 
              fontSize: "0.85rem", 
              fontWeight: "700",
              border: "1px solid rgba(255, 46, 46, 0.3)" 
            }}>
              📍 Tap Map Location to View Details
            </span>
          </div>
        </div>

        <div className="map-container" style={{ 
          width: "100%", 
          maxWidth: "1000px",
          margin: "0 auto",
          borderRadius: "16px", 
          overflow: "hidden", 
          border: "1px solid rgba(255, 46, 46, 0.35)", 
          position: "relative", 
          boxShadow: "0 0 40px rgba(255, 46, 46, 0.15), 0 15px 35px rgba(0,0,0,0.8)" 
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
            .map-section {
              padding: 4rem 1rem 6rem;
            }
            .map-title {
              font-size: clamp(1.6rem, 5vw, 2.5rem);
            }
            .map-subtitle {
              font-size: 1rem;
              max-width: 600px;
            }
            .map-container {
              height: 550px;
            }
            
            @media (max-width: 768px) {
              .map-section {
                padding: 2rem 0.25rem 6rem !important;
              }
              .map-header {
                margin: 0.5rem 0 1.25rem !important;
              }
              .map-title {
                font-size: clamp(1.4rem, 5vw, 1.9rem) !important;
                margin-bottom: 0.4rem !important;
                line-height: 1.2 !important;
              }
              .map-subtitle {
                font-size: 0.85rem !important;
                padding: 0 0.5rem !important;
              }
              .map-container {
                height: 480px !important;
                width: 100% !important;
                border-radius: 14px !important;
                border: 1px solid rgba(255, 46, 46, 0.4) !important;
              }
            }

            .custom-popup .leaflet-popup-content-wrapper {
              background: #fff;
              border-radius: 12px;
              box-shadow: 0 8px 20px rgba(0,0,0,0.4);
              padding: 0;
              overflow: hidden;
            }
            .custom-popup .leaflet-popup-content {
              margin: 0;
              line-height: 1.5;
            }
            .custom-popup .leaflet-popup-close-button {
              top: 10px !important;
              right: 10px !important;
              color: #333 !important;
              background: rgba(255, 255, 255, 0.9) !important;
              border-radius: 50% !important;
              width: 26px !important;
              height: 26px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
              z-index: 10 !important;
              font-size: 16px !important;
              font-weight: bold !important;
              padding: 0 !important;
            }
            .custom-popup .leaflet-popup-close-button:hover {
              background: #f1f1f1 !important;
            }
            .custom-popup .leaflet-popup-tip {
              background: #fff;
            }
          `}} />
        </div>
      </div>
    </section>
  );
}

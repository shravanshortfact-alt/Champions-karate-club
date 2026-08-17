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
      <div className="container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        <div className="map-header" style={{ textAlign: "center" }}>
          <h2 className="text-primary map-title" style={{ fontWeight: "bold", textTransform: "uppercase", lineHeight: "1.3" }}>
            Find Your Nearest<br/>Branch
          </h2>
          <p className="text-muted map-subtitle" style={{ margin: "0 auto" }}>
            Train with Champions Karate Club at a location near you. Search or use your location to find the perfect branch.
          </p>
          <p style={{ color: "var(--primary)", fontSize: "1rem", fontWeight: "bold", marginTop: "1rem" }}>
            Click on Map Location to View details
          </p>
        </div>

        <div className="map-container" style={{ 
          width: "100%", 
          maxWidth: "1000px",
          margin: "0 auto",
          borderRadius: "16px", 
          overflow: "hidden", 
          border: "1px solid rgba(249, 115, 22, 0.3)", 
          position: "relative", 
          boxShadow: "0 0 40px rgba(249, 115, 22, 0.15), 0 15px 35px rgba(0,0,0,0.8)" 
        }}>
          <DynamicMap 
            locations={locations} 
            mapCenter={mapCenter} 
            mapZoom={mapZoom} 
            handleBranchSelect={handleBranchSelect} 
          />
          
          <style dangerouslySetInnerHTML={{__html: `
            .map-section {
              padding: 6rem 1rem;
            }
            .map-header {
              margin: 3rem 0;
            }
            .map-title {
              font-size: 2.5rem;
              margin-bottom: 1rem;
            }
            .map-subtitle {
              font-size: 1.1rem;
              max-width: 600px;
            }
            .map-container {
              height: 600px;
            }
            
            @media (max-width: 768px) {
              .map-section {
                padding: 3rem 1rem;
              }
              .map-header {
                margin: 1.5rem 0;
              }
              .map-title {
                font-size: 1.6rem;
                margin-bottom: 1rem;
              }
              .map-subtitle {
                font-size: 0.95rem;
                padding: 0 0.5rem;
              }
              .map-container {
                height: 400px;
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

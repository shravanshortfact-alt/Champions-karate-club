"use client";
import React, { useState, useEffect } from "react";

export const runtime = 'edge';


export default function MapBranchesPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/admin/map-locations");
      if (res.ok) {
        const data: any = await res.json();
        setLocations(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/admin/map-locations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      fetchLocations();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteLocation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this branch?")) return;
    try {
      await fetch(`/api/admin/map-locations/${id}`, { method: "DELETE" });
      fetchLocations();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="admin-container" style={{ padding: "2rem" }}>
      <h1 style={{ color: "var(--primary)", marginBottom: "1rem", whiteSpace: "nowrap", fontSize: "clamp(1.5rem, 5vw, 2.5rem)" }}>Map & Branches</h1>
      <p style={{ marginBottom: "2rem" }}>Manage Champions Karate Club dojo locations displayed on the public website.</p>
      
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <a href="/admin/map-branches/add" style={{ padding: "0.5rem 1rem", background: "var(--primary)", color: "#000", borderRadius: "5px", textDecoration: "none", fontWeight: "bold" }}>+ Add New Branch</a>
        <a href="/admin/map-branches/editor" style={{ padding: "0.5rem 1rem", background: "#333", color: "#fff", borderRadius: "5px", textDecoration: "none" }}>Map Editor</a>
      </div>

      {loading ? (
        <p>Loading branches...</p>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
          <thead>
            <tr>
              <th>Branch Name</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: "1rem", textAlign: "center" }}>No branches found</td></tr>
            ) : (
              locations.map((loc) => (
                <tr key={loc.id}>
                  <td data-label="Branch Name">{loc.name}</td>
                  <td data-label="Location">{loc.address}</td>
                  <td data-label="Status">
                    <span style={{ 
                      color: loc.isActive ? "#10B981" : "#EF4444",
                      background: loc.isActive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      padding: "4px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "bold", display: "inline-block"
                    }}>
                      {loc.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <div className="action-buttons">
                      <a href={`/admin/map-branches/edit/${loc.id}`} className="btn-action">Edit</a>
                      <button onClick={() => toggleStatus(loc.id, loc.isActive)} className="btn-action">
                        {loc.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={() => deleteLocation(loc.id)} className="btn-action btn-delete">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          background: #111;
          border-radius: 8px;
          overflow: hidden;
        }
        .admin-table th, .admin-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #333;
        }
        .admin-table th {
          background: #222;
          color: #fff;
        }
        .btn-action {
          padding: 8px 16px;
          background: #333;
          color: #fff;
          border-radius: 6px;
          text-decoration: none;
          font-size: 0.9rem;
          border: none;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }
        .btn-action:hover {
          background: #444;
        }
        .btn-delete {
          background: #dc2626;
        }
        .btn-delete:hover {
          background: #b91c1c;
        }
        .action-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .admin-container {
            padding: 1rem 0.5rem !important;
          }
          .admin-table thead {
            display: none;
          }
          .admin-table, .admin-table tbody, .admin-table tr, .admin-table td {
            display: block;
            width: 100%;
          }
          .admin-table tr {
            margin-bottom: 1.5rem;
            border: 1px solid #27272a;
            background: linear-gradient(135deg, #18181b 0%, #09090b 100%);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
          }
          .admin-table td {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
            padding: 1.25rem;
            border-bottom: 1px solid #27272a;
            gap: 0.5rem;
          }
          .admin-table td:last-child {
            border-bottom: none;
          }
          .admin-table td::before {
            content: attr(data-label);
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #fbbf24;
            font-weight: bold;
            margin-bottom: 0.25rem;
          }
          .admin-table td:nth-child(1) {
            font-size: 1.3rem;
            font-weight: 700;
            color: white;
          }
          .admin-table td:nth-child(2) {
            color: #d1d5db;
            font-size: 1rem;
            line-height: 1.5;
          }
          .action-buttons {
            display: flex !important;
            flex-direction: row !important;
            justify-content: flex-start;
            flex-wrap: wrap;
            gap: 0.75rem;
            width: 100%;
            margin-top: 0.5rem;
          }
        }
      `}} />
    </div>
  );
}

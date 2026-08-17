"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditBranchPage() {
  const router = useRouter();
  const params = useParams();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    googleMapsUrl: "",
    latitude: "",
    longitude: "",
    phone: "",
    whatsapp: "",
    timings: "",
    programs: "",
    description: "",
    image: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    const fetchLocation = async () => {
      try {
        const res = await fetch("/api/admin/map-locations");
        if (res.ok) {
          const data: any = await res.json();
          const location = data.find((l: any) => l.id === params.id);
          if (location) {
            setFormData({
              name: location.name || "",
              address: location.address || "",
              city: location.city || "",
              googleMapsUrl: location.googleMapsUrl || "",
              latitude: location.latitude || "",
              longitude: location.longitude || "",
              phone: location.phone || "",
              whatsapp: location.whatsapp || "",
              timings: location.timings || "",
              programs: location.programs || "",
              description: location.description || "",
              image: location.image || "",
              isActive: location.isActive,
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLocation();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSaving(true);
    const data = new FormData();
    data.append("file", file);
    
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        const json = await res.json();
        setFormData({ ...formData, image: json.url });
      } else {
        alert("Image upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading image");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/map-locations/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/admin/map-branches");
      } else {
        alert("Failed to update branch");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating branch");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: "2rem" }}>Loading...</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "800px" }}>
      <h1 style={{ color: "var(--primary)", marginBottom: "1rem" }}>Edit Branch</h1>
      <a href="/admin/map-branches" style={{ color: "#aaa", textDecoration: "none", marginBottom: "2rem", display: "inline-block" }}>&larr; Back to Branches</a>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "#111", padding: "2rem", borderRadius: "8px" }}>
        {/* Similar form layout as Add Branch */}
        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Branch Name *</label>
            <input required type="text" name="name" value={formData.name} onChange={handleChange} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #333", background: "#000", color: "#fff" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>City</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #333", background: "#000", color: "#fff" }} />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>Address *</label>
          <textarea required name="address" value={formData.address} onChange={handleChange} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #333", background: "#000", color: "#fff", minHeight: "80px" }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>Google Maps URL</label>
          <input type="url" name="googleMapsUrl" value={formData.googleMapsUrl} onChange={handleChange} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #333", background: "#000", color: "#fff" }} />
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Latitude</label>
            <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #333", background: "#000", color: "#fff" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Longitude</label>
            <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #333", background: "#000", color: "#fff" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Phone Number</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #333", background: "#000", color: "#fff" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>WhatsApp Number</label>
            <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #333", background: "#000", color: "#fff" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Timings</label>
            <input type="text" name="timings" value={formData.timings} onChange={handleChange} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #333", background: "#000", color: "#fff" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Programs Available</label>
            <input type="text" name="programs" value={formData.programs} onChange={handleChange} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #333", background: "#000", color: "#fff" }} />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>Branch Image</label>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ flex: 1, padding: "0.5rem", borderRadius: "4px", border: "1px solid #333", background: "#000", color: "#fff" }} />
            {formData.image && (
              <div style={{ position: "relative" }}>
                <img src={formData.image} alt="Preview" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "4px" }} />
                <button type="button" onClick={() => setFormData({ ...formData, image: "" })} style={{ position: "absolute", top: "-8px", right: "-8px", background: "red", color: "white", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  &times;
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #333", background: "#000", color: "#fff", minHeight: "80px" }} />
        </div>

        <div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
            Branch is Active (Visible on Public Map)
          </label>
        </div>

        <button type="submit" disabled={saving} style={{ padding: "0.8rem", background: "var(--primary)", color: "#000", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", marginTop: "1rem" }}>
          {saving ? "Saving..." : "Update Branch"}
        </button>
      </form>
    </div>
  );
}

import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";

export default function AddCocktail() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [image, setImage] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function parseCommaList(text) {
    return text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function parseIngredients(text) {
    // Supports:
    // - comma-separated: "Tequila, Triple sec, Lime juice"
    // - newline-separated: one per line
    // - optional amount/unit: "30 ml Tequila" or "1 oz Gin"
    const parts = text.includes("\n") ? text.split("\n") : text.split(",");

    return parts
      .map((s) => s.trim())
      .filter(Boolean)
      .map((line) => {
        // Match: amount + optional unit + name
        // Examples:
        // "30 ml Tequila"
        // "1.5 oz Gin"
        // "2 dashes Angostura bitters"
        const m = line.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)$/);

        if (m) {
          return {
            amount: Number(m[1]),
            unit: (m[2] || "").trim(),
            name: m[3].trim(),
          };
        }

        // Fallback: just a name
        return { amount: null, unit: "", name: line };
      });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const cleanName = name.trim();
    if (!cleanName) {
      setSaving(false);
      setMessage("❌ Name is required.");
      return;
    }

    try {
      const ingredients = parseIngredients(ingredientsText);
      const tags = parseCommaList(tagsText);

      await addDoc(collection(db, "cocktails"), {
        name: cleanName,
        description: description.trim(),
        ingredients,
        tags,
        image: image.trim(),
        createdAt: serverTimestamp(),
      });

      // Nice UX: brief success then go back to list
      setMessage("✅ Cocktail added. Taking you back…");

      // Reset fields (optional, but nice if user navigates back here)
      setName("");
      setDescription("");
      setIngredientsText("");
      setTagsText("");
      setImage("");

      // Redirect to list so the new card appears immediately
      setTimeout(() => navigate("/"), 400);
    } catch (err) {
      console.error("Error adding cocktail:", err);
      setMessage(`❌ Error adding cocktail: ${err?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form">
      <h2 style={{ marginTop: 0, marginBottom: 14 }}>Add a Cocktail</h2>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Margarita"
          />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Bright, citrusy, and dangerously easy to drink."
          />
        </div>

        <div className="field">
          <label>Ingredients (comma-separated)</label>
          <input
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            placeholder="Tequila, Triple sec, Lime juice"
          />
          <div className="helper">These show on the detail page as a list.</div>
        </div>

        <div className="field">
          <label>Tags (comma-separated)</label>
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="classic, citrus, tequila"
          />
          <div className="helper">These show as pills on list + detail.</div>
        </div>

        <div className="field">
          <label>Image URL (optional)</label>
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <button className="btn" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Add Cocktail"}
        </button>
      </form>

      {message && <div className="notice">{message}</div>}
    </div>
  );
}


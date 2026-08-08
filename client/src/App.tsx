import { useState } from "react";
import { checkSystem, Category } from "./api.js";

// UI states you must handle for Issue 4: idle, loading, success, error.
type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  void categories;

  async function handleCheck() {
    // TODO(Issue 4): set loading, call checkSystem(), then either
    //   - success: store categories and show Online + the list, or
    //   - error: show Offline + a useful message.
    setState("loading");
    setError("");

    try {
      const result = await checkSystem();
      setCategories(result.categories);
      setState("success");
    } catch (err) {
      setCategories([]);
      setError(err instanceof Error ? err.message : "Unable to connect to the backend.");
      setState("error");
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-success">IT Service Desk</span>
      </h1>

      <button className="btn btn-success" onClick={handleCheck} disabled={state === "loading"}>
        {state === "loading" ? "Loading…" : "Check System"}
      </button>

      <h3 className="Bootstrap_is_installed mt-3"}>
        Bootstrap is installed
      </h3>

      {state === "loading" && (
        <p className="mt-3">Checking system status…</p>
      )}

      {state === "success" && (
        <div className="success mt-3">
          <strong>System Status: Online</strong>
          <ul className="mt-2">
            {categories.map((category) => (
              <li key={category.id}>{category.name}</li>  
            ))}
          </ul>
        </div>
      )}

      {state === "error" && (
        <div className="error mt-3">
          <strong>System Status: Offline</strong><br></br> Unable to connect to TokTickIT API
          <div>{error}</div>
        </div>
      )}

    </div>
  );
}



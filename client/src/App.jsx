import React, { useState } from "react";
import axios from "axios";
import ResultCard from "./components/ResultCard";

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/oas/test", {
        oasUrl: url,
      });
      setResult(res.data);
    } catch (err) {
      console.error("API Error:", err);
      setError("Something went wrong while fetching the OAS results.");
    } finally {
      setLoading(false);
    }
  };

  const retryEndpoint = async (failedData) => {
    try {
      const res = await axios.post("http://localhost:5000/api/oas/retry", {
        url: failedData.request.url,
        method: failedData.method,
        data: failedData.request.data || null,
      });
  
      setResult((prev) => {
        const updated = prev.results.map((r) =>
          r.endpoint === failedData.endpoint && r.method === failedData.method
            ? { ...r, ...res.data, success: true }
            : r
        );
        return { ...prev, results: updated };
      });
    } catch (err) {
      console.error("Retry failed:", err);
    }
  };
  

  const exportResults = (type) => {
    if (!result?.results?.length) return;

    const filename = `swagger_results.${type}`;
    let content = "";

    if (type === "json") {
      content = JSON.stringify(result.results, null, 2);
    } else if (type === "csv") {
      const headers = Object.keys(result.results[0]).join(",");
      const rows = result.results.map((r) =>
        Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      );
      content = [headers, ...rows].join("\n");
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white p-8">
      <h1 className="text-2xl font-bold mb-4">SwaggerDrill</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter OAS JSON URL"
          className="p-2 rounded border w-96 mr-2"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Submit
        </button>
      </form>

      {loading && (
        <div className="text-center text-blue-600 font-semibold my-4">
          Loading...
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {result?.results?.length > 0 && (
        <>
          <div className="flex gap-4 mb-4">
            <button
              className="bg-green-600 text-white px-3 py-1 rounded"
              onClick={() => exportResults("json")}
            >
              Export JSON
            </button>
            <button
              className="bg-yellow-600 text-white px-3 py-1 rounded"
              onClick={() => exportResults("csv")}
            >
              Export CSV
            </button>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded p-4 shadow mt-4">
            <h2 className="text-xl font-semibold mb-2">Results</h2>
            <div className="grid gap-4 mt-4">
              {result.results.map((r, idx) => (
                <ResultCard key={idx} data={r} onRetry={retryEndpoint} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;

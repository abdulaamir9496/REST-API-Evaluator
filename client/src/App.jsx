import React, { useState, useEffect } from "react";
import axios from "axios";
import ResultCard from "./components/ResultCard";

// 🆕 Helper function to group by status
const groupResultsByStatus = (results) => {
  const groups = {
    success: [],
    failed: [],
    error: [],
  };

  results.forEach((r) => {
    if (r.success) {
      groups.success.push(r);
    } else if (r.error) {
      groups.error.push(r);
    } else {
      groups.failed.push(r);
    }
  });

  return groups;
};
function App() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [specs, setSpecs] = useState([]);
  const [selectedSpec, setSelectedSpec] = useState("");
  const [selectedMethodEndpoint, setSelectedMethodEndpoint] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [endpoints, setEndpoints] = useState([]);
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");

  const API_BASE = "http://localhost:5000/api/oas";
  const PETSTORE_API = "https://petstore.swagger.io/v2/swagger.json";

  const handleUploadSpec = async () => {
    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        await axios.post(`${API_BASE}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setFile(null);
      } else if (url) {
        await axios.post(`${API_BASE}/add-url`, { url });
        setUrl("");
      } else {
        setError("Please select a file or enter a URL to upload.");
        return;
      }

      const res = await axios.get(`${API_BASE}/available-specs`);
      const updatedSpecs = res.data;
      if (!updatedSpecs.includes(PETSTORE_API)) updatedSpecs.push(PETSTORE_API);
      setSpecs(updatedSpecs);
      setSelectedSpec(updatedSpecs[0]);
    } catch (err) {
      console.error("Spec upload failed:", err);
      setError("Failed to upload spec. Please check the format.");
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/available-specs`)
      .then((res) => {
        const availableSpecs = res.data;
        if (!availableSpecs.includes(PETSTORE_API)) {
          availableSpecs.push(PETSTORE_API);
        }
        setSpecs(availableSpecs);
        if (availableSpecs.includes(PETSTORE_API)) {
          setSelectedSpec(PETSTORE_API);
        } else if (availableSpecs.length > 0) {
          setSelectedSpec(availableSpecs[0]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch specs:", err);
        setError("Could not load specs.");
        setSpecs([PETSTORE_API]);
        setSelectedSpec(PETSTORE_API);
      });
  }, []);

  useEffect(() => {
    if (!selectedSpec) return;
    setLoading(true);
    axios
      .get(`${API_BASE}/endpoints`, { params: { spec: selectedSpec } })
      .then((res) => {
        const flatEndpoints = [];
        res.data.forEach((endpoint) => {
          endpoint.methods.forEach((method) => {
            if (method.toLowerCase() !== "parameters") {
              flatEndpoints.push({
                path: endpoint.path,
                method: method.toLowerCase(),
                combined: `${method.toUpperCase()} ${endpoint.path}`,
                description: endpoint.description || "",
              });
            }
          });
        });

        const methodOrder = ["get", "post", "put", "patch", "delete"];
        flatEndpoints.sort((a, b) => {
          if (a.path !== b.path) {
            return a.path.localeCompare(b.path);
          }
          return methodOrder.indexOf(a.method) - methodOrder.indexOf(b.method);
        });

        setEndpoints(flatEndpoints);
        if (flatEndpoints.length > 0) {
          setSelectedMethodEndpoint(flatEndpoints[0].combined);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch endpoints:", err);
        setError("Could not load endpoints from spec.");
        setLoading(false);
      });
  }, [selectedSpec]);

  const parseMethodEndpoint = (combined) => {
    if (!combined) return { method: "", endpoint: "" };
    const parts = combined.split(" ");
    const method = parts[0].toLowerCase();
    const endpoint = parts.slice(1).join(" ");
    return { method, endpoint };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");

    const { method, endpoint } = parseMethodEndpoint(selectedMethodEndpoint);

    try {
      const res = await axios.get(`${API_BASE}/test-dummy`, {
        params: {
          spec: url || selectedSpec,
          endpoint: manualInput || endpoint,
          method: method,
        },
      });

      const resultData = Array.isArray(res.data) ? res.data : [res.data];
      setResult({ results: resultData });
    } catch (err) {
      console.error("API Error:", err);
      setError(err.response?.data?.error || "Something went wrong while fetching the OAS results.");
    } finally {
      setLoading(false);
    }
  };

  const retryEndpoint = async (failedData) => {
    try {
      const res = await axios.post(`${API_BASE}/retry`, {
        url: failedData.request.url,
        method: failedData.method,
        data: failedData.request.data || null,
      });

      const retriedResult = { ...res.data, success: true };

      setResult((prev) => {
        const updated = prev.results.map((r) =>
          r.endpoint === failedData.endpoint && r.method === failedData.method
            ? retriedResult
            : r
        );
        return { ...prev, results: updated };
      });
    } catch (err) {
      console.error("Retry failed:", err);
      const errorResult = {
        ...failedData,
        success: false,
        error: "Retry failed",
      };
      setResult((prev) => {
        const updated = prev.results.map((r) =>
          r.endpoint === failedData.endpoint && r.method === failedData.method
            ? errorResult
            : r
        );
        return { ...prev, results: updated };
      });
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
        Object.values(r)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
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

  const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
    const path = endpoint.path;
    if (!acc[path]) {
      acc[path] = [];
    }
    acc[path].push(endpoint);
    return acc;
  }, {});

  const getMethodColor = (method) => {
    switch (method.toLowerCase()) {
      case "get":
        return "text-green-600";
      case "post":
        return "text-blue-600";
      case "put":
        return "text-yellow-600";
      case "patch":
        return "text-orange-600";
      case "delete":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
  };

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white p-8">
      <h1 className="text-2xl font-bold mb-4">SwaggerDrill - Petstore API Testing</h1>

      <form onSubmit={handleSubmit} className="mb-4">
        {/* OAS File Input Section */}
        <div className="flex flex-col gap-2 mb-4">
          <input
            type="url"
            placeholder="Enter URL of OAS spec"
            value={url}
            onChange={handleUrlChange}
            className="p-2 rounded border w-full max-w-xl"
          />
          <input
            type="file"
            accept=".json,.yaml,.yml"
            onChange={handleFileUpload}
            className="p-2 rounded border w-full max-w-xl"
          />
          <button
            type="button"
            className="bg-green-600 text-white px-4 py-2 rounded w-fit"
            onClick={handleUploadSpec}
          >
            Upload Spec
          </button>
        </div>

        {/* Spec selector */}
        <select
          className="p-2 rounded border w-full max-w-xl mb-2"
          value={selectedSpec}
          onChange={(e) => setSelectedSpec(e.target.value)}
        >
          {specs.map((spec) => (
            <option key={spec} value={spec}>
              {spec === PETSTORE_API ? "Petstore API (Swagger)" : spec}
            </option>
          ))}
        </select>

        {/* Endpoint Selector */}
        <select
          className="p-2 rounded border w-full max-w-xl mb-2"
          value={selectedMethodEndpoint}
          onChange={(e) => setSelectedMethodEndpoint(e.target.value)}
        >
          {Object.entries(groupedEndpoints).map(([path, endpointGroup]) => (
            <optgroup key={path} label={path}>
              {endpointGroup.map((endpoint, idx) => (
                <option
                  key={`${path}-${idx}`}
                  value={endpoint.combined}
                  className={getMethodColor(endpoint.method)}
                >
                  {endpoint.method.toUpperCase()} {endpoint.path}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Optional manual input */}
        <input
          className="p-2 rounded border w-full max-w-xl mb-2"
          placeholder="Manual endpoint (optional)"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
        />

        {/* Submit Test */}
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {loading ? "Testing..." : "Test Spec"}
        </button>
      </form>

      
      {loading && !result && (
        <div className="text-center text-blue-600 font-semibold my-4">
          Loading endpoints from {selectedSpec === PETSTORE_API ? "Petstore API" : selectedSpec}...
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="text-red-700 hover:text-red-900 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {result && (
        <div className="bg-white dark:bg-gray-900 rounded p-4 shadow mt-4">
          <h2 className="text-xl font-semibold mb-2">Dummy Data Test Result</h2>
          <div className="mb-2">
            <strong>Endpoint:</strong> <code>{result?.path}</code>
          </div>
          <div className="mb-2">
            <strong>Method:</strong>
            <span className={`font-bold ml-2 ${getMethodColor(result?.method)}`}>
              {result?.method}
            </span>
          </div>

          <div className="mt-4">
            <strong>Generated Request Body:</strong>
            <pre className="bg-gray-100 dark:bg-gray-800 text-sm p-4 rounded overflow-x-auto mt-2">
              {JSON.stringify(result?.dummyRequestBody, null, 2)}
            </pre>
          </div>
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
            <h2 className="text-xl font-semibold mb-4">Results</h2>

            {Object.entries(groupResultsByStatus(result.results)).map(
              ([status, group]) =>
                group.length > 0 && (
                  <div key={status} className="mb-6">
                    <h3 className="text-lg font-bold capitalize mb-2">
                      {status === "success" ? "✅ Success" : status === "failed" ? "❌ Failed" : "⚠️ Errors"}
                    </h3>
                    <div className="grid gap-4">
                      {group.map((r, idx) => (
                        <ResultCard key={idx} data={r} onRetry={retryEndpoint} />
                      ))}
                    </div>
                  </div>
                )
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;


// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import ResultCard from "./components/ResultCard";

// function App() {
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [endpoints, setEndpoints] = useState([]);
//   const [oasUrl, setOasUrl] = useState(""); // State for OAS URL input
//   const API_BASE = "http://localhost:5000/api/oas";

//   // Error message auto-dismissal after 5 seconds
//   useEffect(() => {
//     if (error) {
//       const timer = setTimeout(() => setError(""), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [error]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setResult(null);
//     setError("");

//     try {
//       const res = await axios.post(`${API_BASE}/test`, { oasUrl }); // Send the OAS URL to the backend
//       setResult(res.data); // Set the result from the response
//       setEndpoints(res.data.results); // Assuming results contain the endpoints
//     } catch (err) {
//       console.error("API Error:", err);
//       setError("Something went wrong while fetching the OAS results.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white p-8">
//       <h1 className="text-2xl font-bold mb-4">SwaggerDrill - OAS Testing</h1>
//       <form onSubmit={handleSubmit} className="mb-4">
//         <input
//           className="p-2 rounded border w-96 mr-2"
//           placeholder="Paste OAS URL here"
//           value={oasUrl}
//           onChange={(e) => setOasUrl(e.target.value)} // Update state on input change
//           required
//         />
//         <button 
//           type="submit" 
//           disabled={loading}
//           className={`px-4 py-2 rounded transition-colors ${
//             loading 
//               ? 'bg-gray-400 cursor-not-allowed' 
//               : 'bg-blue-600 text-white hover:bg-blue-700'
//           }`}
//         >
//           {loading ? 'Loading...' : 'Load OAS'}
//         </button>
//       </form>

//       {error && (
//         <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
//           {error}
//         </div>
//       )}

//       {result && (
//         <div className="bg-white dark:bg-gray-900 rounded p-4 shadow mt-4">
//           <h2 className="text-xl font-semibold mb-2">OAS Test Result</h2>
//           {/* Display the result here */}
//           <pre className="bg-gray-100 dark:bg-gray-800 text-sm p-4 rounded overflow-x-auto">
//             {JSON.stringify(result, null, 2)}
//           </pre>
//         </div>
//       )}

//       {endpoints.length > 0 && (
//         <div className="bg-white dark:bg-gray-900 rounded p-4 shadow mt-4">
//           <h2 className="text-xl font-semibold mb-2">Endpoints</h2>
//           <ul>
//             {endpoints.map((endpoint, index) => (
//               <li key={index}>
//                 <strong>{endpoint.method}</strong>: {endpoint.path}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;
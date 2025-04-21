import React, { useState, useEffect } from "react";
import axios from "axios";
import ResultCard from "./components/ResultCard";

function App() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [specs, setSpecs] = useState([]);
  const [selectedSpec, setSelectedSpec] = useState("");
  const [selectedMethodEndpoint, setSelectedMethodEndpoint] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [endpoints, setEndpoints] = useState([]);

  const API_BASE = "http://localhost:5000/api/oas";
  
  // For development/testing purposes, include the Petstore API
  const PETSTORE_API = "https://petstore.swagger.io/v2/swagger.json";

  // Error message auto-dismissal after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    axios.get(`${API_BASE}/available-specs`)
      .then(res => {
        // During development, append Petstore API if not present
        const availableSpecs = res.data;
        if (!availableSpecs.includes(PETSTORE_API)) {
          availableSpecs.push(PETSTORE_API);
        }
        setSpecs(availableSpecs);
        // Select Petstore by default if available
        if (availableSpecs.includes(PETSTORE_API)) {
          setSelectedSpec(PETSTORE_API);
        } else if (availableSpecs.length > 0) {
          setSelectedSpec(availableSpecs[0]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch specs:", err);
        setError("Could not load specs.");
        // Fallback to Petstore if server is not available
        setSpecs([PETSTORE_API]);
        setSelectedSpec(PETSTORE_API);
      });
  }, []);

  useEffect(() => {
    if (!selectedSpec) return;

    // Show loading state while fetching endpoints
    setLoading(true);
    axios.get(`${API_BASE}/endpoints`, { params: { spec: selectedSpec } })
      .then(res => {
        console.log("Endpoints response:", res.data); // Debug log
        
        // Properly process the endpoints to include all methods
        const flatEndpoints = [];
        res.data.forEach(endpoint => {
          endpoint.methods.forEach(method => {
            // Exclude parameters which is not an HTTP method
            if (method.toLowerCase() !== 'parameters') {
              flatEndpoints.push({
                path: endpoint.path,
                method: method.toLowerCase(),
                combined: `${method.toUpperCase()} ${endpoint.path}`,
                // Add description if available
                description: endpoint.description || ''
              });
            }
          });
        });

        // Sort endpoints by path and then by method order
        const methodOrder = ['get', 'post', 'put', 'patch', 'delete'];
        flatEndpoints.sort((a, b) => {
          if (a.path !== b.path) {
            return a.path.localeCompare(b.path);
          }
          return methodOrder.indexOf(a.method) - methodOrder.indexOf(b.method);
        });

        console.log("Processed endpoints:", flatEndpoints); // Debug log
        
        setEndpoints(flatEndpoints);
        if (flatEndpoints.length > 0) {
          setSelectedMethodEndpoint(flatEndpoints[0].combined);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch endpoints:", err);
        setError("Could not load endpoints from spec.");
        setLoading(false);
      });
  }, [selectedSpec]);

  // Parse the selected method and endpoint from the combined value
  const parseMethodEndpoint = (combined) => {
    if (!combined) return { method: '', endpoint: '' };
    const parts = combined.split(' ');
    const method = parts[0].toLowerCase();
    const endpoint = parts.slice(1).join(' ');
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
                spec: selectedSpec,
                endpoint: manualInput || endpoint,
                method: method,
            },
        });
        setResult(res.data[0]); // Since test-dummy returns an array
    } catch (err) {
        console.error("API Error:", err);
        // Enhanced error message
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

      setResult(prev => {
        const updated = prev.results.map(r =>
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
      const rows = result.results.map(r =>
        Object.values(r).map(v =>
          `"${String(v).replace(/"/g, '""')}"`
        ).join(",")
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

  // Group endpoints by path for better visualization
  const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
    const path = endpoint.path;
    if (!acc[path]) {
      acc[path] = [];
    }
    acc[path].push(endpoint);
    return acc;
  }, {});

  // Get color for method type
  const getMethodColor = (method) => {
    switch (method.toLowerCase()) {
      case 'get':
        return 'text-green-600';
      case 'post':
        return 'text-blue-600';
      case 'put':
        return 'text-yellow-600';
      case 'patch':
        return 'text-orange-600';
      case 'delete':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white p-8">
      <h1 className="text-2xl font-bold mb-4">SwaggerDrill - Petstore API Testing</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <select
          className="p-2 rounded border w-96 mr-2"
          value={selectedSpec}
          onChange={(e) => setSelectedSpec(e.target.value)}
        >
          {specs.map((spec) => (
            <option key={spec} value={spec}>
              {spec === PETSTORE_API ? 'Petstore API (Swagger)' : spec}
            </option>
          ))}
        </select>

        {/* Combined method and endpoint dropdown with groups */}
        <select
          className="p-2 rounded border w-96 mr-2"
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
                  {endpoint.method.toUpperCase()}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <input
          className="p-2 rounded border w-96 mr-2"
          placeholder="Manual endpoint (optional)"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
        />

        {/* Button with loading state and disabled state */}
        <button 
          type="submit" 
          disabled={loading}
          className={`px-4 py-2 rounded transition-colors ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Testing...' : 'Test Spec'}
        </button>
      </form>

      {/* Method type color indicators */}
      <div className="flex gap-4 mb-4 text-sm">
        <span className="flex items-center">
          <span className="w-4 h-4 rounded bg-green-500 mr-2"></span> GET
        </span>
        <span className="flex items-center">
          <span className="w-4 h-4 rounded bg-blue-500 mr-2"></span> POST
        </span>
        <span className="flex items-center">
          <span className="w-4 h-4 rounded bg-yellow-500 mr-2"></span> PUT
        </span>
        <span className="flex items-center">
          <span className="w-4 h-4 rounded bg-orange-500 mr-2"></span> PATCH
        </span>
        <span className="flex items-center">
          <span className="w-4 h-4 rounded bg-red-500 mr-2"></span> DELETE
        </span>
      </div>

      {loading && !result && (
        <div className="text-center text-blue-600 font-semibold my-4">
          Loading endpoints from {selectedSpec === PETSTORE_API ? 'Petstore API' : selectedSpec}...
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
            <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => exportResults("json")}>Export JSON</button>
            <button className="bg-yellow-600 text-white px-3 py-1 rounded" onClick={() => exportResults("csv")}>Export CSV</button>
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
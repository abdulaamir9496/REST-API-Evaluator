import React, { useState } from "react";
import axios from "axios";

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.post("http://localhost:5000/api/oas/test", {
      oasUrl: url,
    });
    setResult(res.data);
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

      {result && (
        <div className="bg-white dark:bg-gray-900 rounded p-4 shadow">
          <h2 className="text-xl font-semibold mb-2">Results</h2>
          <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;



// import { useState } from "react";
// import axios from "axios";
// import ResultCard from "./components/ResultCard";

// function App() {
//   const [oasUrl, setOasUrl] = useState("");
//   const [results, setResults] = useState([]);
//   const [summary, setSummary] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleSubmit = async () => {
//     if (!oasUrl) return;
//     setLoading(true);
//     setError("");
//     try {
//       const res = await axios.post("http://localhost:5000/api/oas/test", {
//         oasUrl,
//       });
//       setResults(res.data.results);
//       setSummary(res.data.summary);
//     } catch (err) {
//       console.error(err);
//       setError("Something went wrong while fetching OAS results.");
//     }
//     setLoading(false);
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 text-gray-800 p-8">
//       <h1 className="text-3xl font-bold mb-6 text-center">OAS Tester</h1>

//       <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">
//         <input
//           type="text"
//           value={oasUrl}
//           onChange={(e) => setOasUrl(e.target.value)}
//           placeholder="Enter OpenAPI (Swagger) URL"
//           className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
//         />
//         <button
//           onClick={handleSubmit}
//           disabled={loading}
//           className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
//         >
//           {loading ? "Testing..." : "Submit"}
//         </button>

//         {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
//       </div>

//       {summary && (
//         <div className="mt-8 max-w-3xl mx-auto">
//           <h2 className="text-2xl font-semibold mb-2">Summary</h2>
//           <p>Total Endpoints: {summary.total}</p>
//           <p>Success Count: {summary.success}</p>
//         </div>
//       )}

//       {results.length > 0 && (
//         <div className="mt-6 max-w-3xl mx-auto grid gap-4">
//           {results.map((r, index) => (
//             <ResultCard key={index} data={r} />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;

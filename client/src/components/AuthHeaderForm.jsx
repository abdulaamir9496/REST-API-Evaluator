import React from "react";

function AuthHeaderForm({ headers, setHeaders }) {
  const handleChange = (e, index, field) => {
    const updatedHeaders = [...headers];
    updatedHeaders[index][field] = e.target.value;
    setHeaders(updatedHeaders);
  };

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const removeHeader = (index) => {
    const updatedHeaders = [...headers];
    updatedHeaders.splice(index, 1);
    setHeaders(updatedHeaders);
  };

  return (
    <div className="mb-4">
      <h3 className="font-semibold mb-2">Optional Auth Headers</h3>
      {headers.map((header, index) => (
        <div key={index} className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Header Key"
            value={header.key}
            onChange={(e) => handleChange(e, index, "key")}
            className="p-2 border rounded w-1/3"
          />
          <input
            type="text"
            placeholder="Header Value"
            value={header.value}
            onChange={(e) => handleChange(e, index, "value")}
            className="p-2 border rounded w-1/2"
          />
          <button
            onClick={() => removeHeader(index)}
            className="bg-red-500 text-white px-2 rounded"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={addHeader}
        className="bg-blue-500 text-white px-3 py-1 rounded"
      >
        + Add Header
      </button>
    </div>
  );
}

export default AuthHeaderForm;

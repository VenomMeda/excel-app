import React, { useState } from "react";
import axios from "axios";

const API_BASE = "https://excel-app-backend.onrender.com";

const Loader = () => (
  <div className="flex justify-center items-center">
    <div className="h-5 w-5 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const StatusMessage = ({ type, message }) => {
  if (!message) return null;
  const colors = {
    success: "bg-green-100 text-green-700 border-green-400",
    error: "bg-red-100 text-red-700 border-red-400",
    info: "bg-blue-100 text-blue-700 border-blue-400",
  };
  return (
    <div className={`border rounded px-3 py-2 text-sm ${colors[type]} mb-2`}>
      {message}
    </div>
  );
};

function App() {
  const [file, setFile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [columns, setColumns] = useState([]);
  const [searchFields, setSearchFields] = useState([{ field: "", query: "" }]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [showColumnSelect, setShowColumnSelect] = useState(false);
  const [results, setResults] = useState([]);
  const [layoutMode, setLayoutMode] = useState("wide");

  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState({ upload: false, sheet: false, search: false });

  const setMessage = (section, type, msg) => {
    setStatus((prev) => ({ ...prev, [section]: { type, msg } }));
    setTimeout(() => {
      setStatus((prev) => ({ ...prev, [section]: null }));
    }, 4000);
  };

  const uploadFile = async () => {
    setLoading((l) => ({ ...l, upload: true }));
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API_BASE}/upload/`, formData);
      setSheets(res.data.sheets);
      setMessage("upload", "success", "✅ File uploaded successfully");
    } catch {
      setMessage("upload", "error", "❌ Upload failed");
    }
    setLoading((l) => ({ ...l, upload: false }));
  };

  const selectSheet = async () => {
    setLoading((l) => ({ ...l, sheet: true }));
    const formData = new FormData();
    formData.append("sheet_name", selectedSheet);
    try {
      const res = await axios.post(`${API_BASE}/select-sheet/`, formData);
      setColumns(res.data.columns);
      setMessage("sheet", "info", `📄 Sheet '${selectedSheet}' loaded`);
    } catch {
      setMessage("sheet", "error", "❌ Sheet selection failed");
    }
    setLoading((l) => ({ ...l, sheet: false }));
  };

  const searchData = async () => {
    setLoading((l) => ({ ...l, search: true }));
    const filters = searchFields
      .filter((f) => f.field && f.query)
      .map((f) => `${f.field}:${f.query}`)
      .join("||");

    const params = { filters };
    if (showColumnSelect && selectedColumns.length > 0) {
      params.columns = selectedColumns.join(",");
    }

    try {
      const res = await axios.get(`${API_BASE}/search/`, { params });
      setResults(res.data);
      setMessage("search", "success", `🔍 Found ${res.data.length} results`);
    } catch {
      setMessage("search", "error", "❌ Search failed");
    }
    setLoading((l) => ({ ...l, search: false }));
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...searchFields];
    updated[index][field] = value;
    setSearchFields(updated);
  };

  const addField = () => {
    setSearchFields([...searchFields, { field: "", query: "" }]);
  };

  const removeField = (index) => {
    setSearchFields(searchFields.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-4xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-semibold text-center mb-6">📊 Excel Data Explorer</h1>

      {/* Upload */}
      <div className="mb-4">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full"
        />
        <button
          onClick={uploadFile}
          className="mt-2 w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Upload Excel
        </button>
        {loading.upload && <Loader />}
        <StatusMessage {...status.upload} />
      </div>

      {/* Sheet Selection */}
      {sheets.length > 0 && (
        <div className="mb-4">
          <select
            value={selectedSheet}
            onChange={(e) => setSelectedSheet(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">-- Choose Sheet --</option>
            {sheets.map((s, i) => (
              <option key={i}>{s}</option>
            ))}
          </select>
          <button
            onClick={selectSheet}
            className="mt-2 w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Load Sheet
          </button>
          {loading.sheet && <Loader />}
          <StatusMessage {...status.sheet} />
        </div>
      )}

      {/* Field Search */}
      {columns.length > 0 && (
        <div className="mb-4">
          {searchFields.map((sf, i) => (
            <div className="flex gap-2 mb-2" key={i}>
              <select
                value={sf.field}
                onChange={(e) => handleFieldChange(i, "field", e.target.value)}
                className="flex-1 border p-2 rounded"
              >
                <option value="">-- Field --</option>
                {columns.map((col, j) => (
                  <option key={j}>{col}</option>
                ))}
              </select>
              <input
                type="text"
                value={sf.query}
                onChange={(e) => handleFieldChange(i, "query", e.target.value)}
                className="flex-1 border p-2 rounded"
                placeholder="Enter query"
              />
              {searchFields.length > 1 && (
                <button onClick={() => removeField(i)} className="text-red-600 px-2">✕</button>
              )}
            </div>
          ))}
          <button onClick={addField} className="text-sm text-blue-600 mb-2">+ Add another field</button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <button
              onClick={() => {
                setShowColumnSelect(false);
                searchData();
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Search All Columns
            </button>
            <button
              onClick={() => setShowColumnSelect(true)}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
            >
              Choose Columns
            </button>
            {showColumnSelect && (
              <select
                value={layoutMode}
                onChange={(e) => setLayoutMode(e.target.value)}
                className="border p-1 text-sm rounded"
              >
                <option value="wide">Table View</option>
                <option value="vertical">Card View</option>
              </select>
            )}
          </div>
        </div>
      )}

      {/* Column Picker */}
      {showColumnSelect && columns.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border rounded p-2 max-h-48 overflow-auto">
            {columns.map((col, i) => (
              <label key={i} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  value={col}
                  checked={selectedColumns.includes(col)}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedColumns((prev) =>
                      prev.includes(value)
                        ? prev.filter((v) => v !== value)
                        : [...prev, value]
                    );
                  }}
                />
                <span>{col}</span>
              </label>
            ))}
          </div>
          <button
            onClick={searchData}
            className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Search Selected Columns
          </button>
          {loading.search && <Loader />}
          <StatusMessage {...status.search} />
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mb-8">
          {layoutMode === "wide" ? (
            <div className="overflow-auto">
              <table className="min-w-full text-sm border border-gray-300">
                <thead className="bg-gray-200">
                  <tr>
                    {Object.keys(results[0]).map((col, i) => (
                      <th key={i} className="px-2 py-1 border whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr key={i} className="odd:bg-white even:bg-gray-50">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-2 py-1 border whitespace-nowrap">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-3">
              {results.map((row, i) => (
                <div key={i} className="bg-white border p-3 rounded shadow-sm text-left">
                  {Object.entries(row).map(([k, v], j) => (
                    <p key={j}><strong>{k}:</strong> {v}</p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;

import React, { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [sheetOptions, setSheetOptions] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [columnOptions, setColumnOptions] = useState([]);
  const [selectedField, setSelectedField] = useState("");
  const [query, setQuery] = useState("");
  const [exactMatch, setExactMatch] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [showColumnSelect, setShowColumnSelect] = useState(false);
  const [results, setResults] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  const backendUrl = "https://<your-render-backend-url>";

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    const formData = new FormData();
    formData.append("file", uploadedFile);
    try {
      const res = await axios.post(`${backendUrl}/upload/`, formData);
      setSheetOptions(res.data.sheets);
      setStatusMessage("✅ File uploaded. Now select a sheet.");
    } catch {
      setStatusMessage("❌ Upload failed");
    }
  };

  const handleSheetSelection = async (e) => {
    const sheet = e.target.value;
    setSelectedSheet(sheet);
    try {
      const res = await axios.post(`${backendUrl}/select-sheet/?sheet_name=${sheet}`);
      setColumnOptions(res.data.columns);
      setStatusMessage("✅ Sheet loaded. Now select a field.");
    } catch {
      setStatusMessage("❌ Sheet load failed");
    }
  };

  const handleSearch = async () => {
    if (!selectedField || !query) return;
    try {
      const params = new URLSearchParams({
        field_name: selectedField,
        query,
        exact: exactMatch
      });
      if (showColumnSelect && selectedColumns.length > 0) {
        params.append("columns", selectedColumns.join(","));
      }
      const res = await axios.get(`${backendUrl}/search/?${params.toString()}`);
      setResults(res.data);
      setStatusMessage(`🔍 Showing ${res.data.length} result(s).`);
    } catch {
      setStatusMessage("❌ Search failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Excel Data Explorer</h1>

      <div className="text-center text-sm text-green-600 mb-4">{statusMessage}</div>

      <div className="flex flex-col items-center gap-4 mb-6">
        <input type="file" accept=".xlsx" onChange={handleFileUpload} />

        {sheetOptions.length > 0 && (
          <select onChange={handleSheetSelection} className="p-2 border rounded w-64">
            <option value="">Select Sheet</option>
            {sheetOptions.map((sheet) => (
              <option key={sheet} value={sheet}>{sheet}</option>
            ))}
          </select>
        )}

        {columnOptions.length > 0 && (
          <>
            <select onChange={(e) => setSelectedField(e.target.value)} className="p-2 border rounded w-64">
              <option value="">Select Field</option>
              {columnOptions.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Enter value"
              className="p-2 border rounded w-64"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={exactMatch} onChange={(e) => setExactMatch(e.target.checked)} />
              Exact match
            </label>

            <div className="flex gap-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={() => {
                  setShowColumnSelect(false);
                  handleSearch();
                }}
              >
                Search All Columns
              </button>
              <button
                className="bg-gray-700 text-white px-4 py-2 rounded"
                onClick={() => setShowColumnSelect(true)}
              >
                Choose Columns
              </button>
            </div>

            {showColumnSelect && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full max-w-md text-left">
                {columnOptions.map((col) => (
                  <label key={col} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      value={col}
                      checked={selectedColumns.includes(col)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedColumns((prev) =>
                          prev.includes(val)
                            ? prev.filter((v) => v !== val)
                            : [...prev, val]
                        );
                      }}
                    />
                    {col}
                  </label>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="overflow-auto max-w-full">
        {results.length > 0 && (
          <table className="table-auto mx-auto text-sm border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                {Object.keys(results[0]).map((col) => (
                  <th key={col} className="border px-2 py-1">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="border px-2 py-1">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;

// === frontend/src/App.js ===
import React, { useState } from "react";
import axios from "axios";

const API_BASE = "https://excel-app-backend.onrender.com";

function App() {
  const [file, setFile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [columns, setColumns] = useState([]);
  const [selectedField, setSelectedField] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showColumnSelect, setShowColumnSelect] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  const uploadFile = async () => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API_BASE}/upload/`, formData);
      setSheets(res.data.sheets);
      setStatusMessage("✅ File uploaded successfully");
    } catch (err) {
      console.error("Upload failed:", err);
      setStatusMessage("❌ Upload failed");
    }
  };

  const selectSheet = async () => {
    const formData = new FormData();
    formData.append("sheet_name", selectedSheet);
    try {
      const res = await axios.post(`${API_BASE}/select-sheet/`, formData);
      setColumns(res.data.columns);
      setStatusMessage("✅ Sheet loaded");
    } catch (err) {
      console.error("Sheet selection failed:", err);
      setStatusMessage("❌ Sheet selection failed");
    }
  };

  const searchData = async () => {
    try {
      const params = {
        field_name: selectedField,
        query: searchQuery,
      };
      if (showColumnSelect && selectedColumns.length > 0) {
        params.columns = selectedColumns.join(",");
      }
      const res = await axios.get(`${API_BASE}/search/`, { params });
      setResults(res.data);
      setStatusMessage(`🔍 Found ${res.data.length} results`);
    } catch (err) {
      console.error("Search failed:", err);
      setStatusMessage("❌ Search failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 text-center flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Excel Data Explorer</h1>

      <p className="text-sm text-green-600 mb-2">{statusMessage}</p>

      <div className="w-full max-w-md flex flex-col gap-4">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-sm text-gray-500"
        />
        <button
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={uploadFile}
        >
          Upload Excel
        </button>

        {sheets.length > 0 && (
          <>
            <select
              className="w-full border rounded p-2"
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
            >
              <option value="">-- Choose Sheet --</option>
              {sheets.map((sheet, i) => (
                <option key={i} value={sheet}>{sheet}</option>
              ))}
            </select>
            <button
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              disabled={!selectedSheet}
              onClick={selectSheet}
            >
              Load Sheet
            </button>
          </>
        )}

        {columns.length > 0 && (
          <>
            <select
              className="w-full border rounded p-2"
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
            >
              <option value="">-- Choose Field --</option>
              {columns.map((col, i) => (
                <option key={i} value={col}>{col}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Enter value to search"
              className="w-full border rounded p-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={() => {
                  setShowColumnSelect(false);
                  searchData();
                }}
              >
                Search All Columns
              </button>
              <button
                className="w-full sm:w-auto px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
                onClick={() => setShowColumnSelect(true)}
              >
                Choose Columns
              </button>
            </div>

            {showColumnSelect && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 max-h-48 overflow-auto border p-2 rounded">
                  {columns.map((col) => (
                    <label key={col} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={col}
                        checked={selectedColumns.includes(col)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedColumns((prev) =>
                            prev.includes(val)
                              ? prev.filter((c) => c !== val)
                              : [...prev, val]
                          );
                        }}
                      />
                      <span>{col}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  onClick={searchData}
                >
                  Search Selected Columns
                </button>
              </>
            )}
          </>
        )}

        {results.length > 0 && (
          <div className="overflow-auto mt-6 w-full">
            <table className="min-w-full text-sm border border-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  {Object.keys(results[0]).map((col, i) => (
                    <th key={i} className="px-2 py-1 border">{col}</th>
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
        )}
      </div>
    </div>
  );
}

export default App;

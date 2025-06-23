import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

const API_BASE = "https://excel-app-backend.onrender.com";

const Loader = () => (
  <div className="flex justify-center items-center mt-2">
    <div className="h-5 w-5 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const StatusMessage = ({ type, msg, persistent }) => {
  if (!msg) return null;
  const colors = {
    success: "bg-green-100 text-green-700 border-green-400",
    error: "bg-red-100 text-red-700 border-red-400",
    info: "bg-blue-100 text-blue-700 border-blue-400",
  };
  return (
    <div
      className={`border rounded px-3 py-2 text-sm transition-all duration-500 ease-in-out ${colors[type] || ""} mb-3 shadow`}
    >
      {msg}
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
  const [loading, setLoading] = useState({
    upload: false,
    sheet: false,
    search: false,
  });

  const [darkMode, setDarkMode] = useState(() => {
    // Try to use system preference or localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('excel-dark-mode');
      if (stored !== null) return stored === 'true';
      // Default to light mode
      return false;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('excel-dark-mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('excel-dark-mode', 'false');
    }
  }, [darkMode]);

  const tableRef = useRef();

  const setMessage = (section, type, msg, persistent = false) => {
    setStatus((prev) => ({
      ...prev,
      [section]: { type, msg, persistent },
    }));
    if (!persistent) {
      setTimeout(() => {
        setStatus((prev) => ({ ...prev, [section]: null }));
      }, 3000);
    }
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
      if (res.data.length > 0) {
        setMessage("search", "success", `🔍 ${res.data.length} results found`, true);
      } else {
        setMessage("search", "info", "⚠️ No results found", true);
      }
    } catch {
      setMessage("search", "error", "❌ Search failed", true);
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

  // Export as PNG
  const exportPNG = async () => {
    if (!tableRef.current) return;
    const canvas = await html2canvas(tableRef.current);
    const link = document.createElement("a");
    link.download = "results.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  // Export as CSV
  const exportCSV = () => {
    if (!results.length) return;
    const header = Object.keys(results[0]);
    const csvRows = [header.join(",")];
    results.forEach(row => {
      csvRows.push(header.map(h => '"' + (row[h] ?? "") + '"').join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const link = document.createElement("a");
    link.download = "results.csv";
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  // Export as XLSX
  const exportXLSX = () => {
    if (!results.length) return;
    const ws = XLSX.utils.json_to_sheet(results);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "results.xlsx");
  };

  // Helper to format date strings
  function formatDate(val) {
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
      const d = new Date(val);
      if (!isNaN(d)) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      }
    }
    return val;
  }

  return (
    <div className={
      `min-h-screen p-2 sm:p-4 flex flex-col items-center transition-colors duration-300 ` +
      (darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-blue-50 to-purple-100')
    }>
      <div className={
        `w-full max-w-full xl:max-w-7xl shadow-lg p-2 sm:p-6 mt-4 sm:mt-8 mb-4 sm:mb-8 border ` +
        (darkMode
          ? 'bg-gray-900 border-gray-700 text-gray-100'
          : 'bg-white rounded-none xl:rounded-2xl border-gray-200 text-gray-900')
      }>
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-center text-blue-700 dark:text-blue-300 mb-2 tracking-tight flex-1">
            📊 Excel Data Explorer
          </h1>
          <button
            onClick={() => setDarkMode((d) => !d)}
            className="ml-4 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition shadow"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <span role="img" aria-label="Light">🌞</span>
            ) : (
              <span role="img" aria-label="Dark">🌙</span>
            )}
          </button>
        </div>
        <p className="text-center text-gray-500 mb-6 text-base">
          Upload your Excel file, select a sheet, and search your data instantly.
        </p>

        {/* Upload Section */}
        <div className="mb-6 flex flex-col sm:flex-row gap-2 items-center justify-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full sm:w-auto border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            onClick={uploadFile}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Upload Excel
          </button>
        </div>
        {loading.upload && <Loader />}
        <StatusMessage {...status.upload} />

        {/* Sheet Selection */}
        {sheets.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row gap-2 items-center justify-center">
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="w-full sm:w-auto border p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">-- Choose Sheet --</option>
              {sheets.map((s, i) => (
                <option key={i}>{s}</option>
              ))}
            </select>
            <button
              onClick={selectSheet}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Load Sheet
            </button>
          </div>
        )}
        {loading.sheet && <Loader />}
        <StatusMessage {...status.sheet} />

        {/* Search Fields */}
        {columns.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-col gap-2 mb-2">
              {searchFields.map((sf, i) => (
                <div className="flex gap-2" key={i}>
                  <select
                    value={sf.field}
                    onChange={(e) => handleFieldChange(i, "field", e.target.value)}
                    className="flex-1 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
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
                    className="flex-1 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter query"
                  />
                  {searchFields.length > 1 && (
                    <button
                      onClick={() => removeField(i)}
                      className="text-red-600 px-2 hover:text-red-800"
                      title="Remove field"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addField}
              className="text-sm text-blue-600 mb-2 hover:underline"
            >
              + Add another field
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
              <button
                onClick={() => {
                  setShowColumnSelect(false);
                  searchData();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
              >
                Search All Columns
              </button>
              <button
                onClick={() => setShowColumnSelect(true)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition"
              >
                Choose Columns
              </button>
              {showColumnSelect && (
                <select
                  value={layoutMode}
                  onChange={(e) => setLayoutMode(e.target.value)}
                  className="border p-1 text-sm rounded focus:outline-none focus:ring-2 focus:ring-purple-200"
                >
                  <option value="wide">Table View</option>
                  <option value="vertical">Card View</option>
                </select>
              )}
            </div>
          </div>
        )}

        {/* Column Selection */}
        {showColumnSelect && columns.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border rounded p-2 max-h-48 overflow-auto bg-gray-50">
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
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
            >
              Search Selected Columns
            </button>
            {loading.search && <Loader />}
          </div>
        )}

        {/* Results Message (always above results) */}
        {status.search?.msg && (
          <div className="mb-4">
            <StatusMessage {...status.search} />
          </div>
        )}

        {/* Export Buttons */}
        {results.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 justify-end">
            <button onClick={exportPNG} className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition shadow">
              Export as PNG
            </button>
            <button onClick={exportCSV} className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition shadow">
              Export as CSV
            </button>
            <button onClick={exportXLSX} className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition shadow">
              Export as XLSX
            </button>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mb-8">
            {layoutMode === "wide" ? (
              <div ref={tableRef} className="overflow-auto rounded-lg border border-gray-300 bg-white shadow">
                <table className="min-w-full text-sm table-auto">
                  <thead className="bg-gray-100">
                    <tr>
                      {Object.keys(results[0]).map((col, i) => (
                        <th
                          key={i}
                          className="px-2 py-1 border whitespace-nowrap text-left font-semibold text-gray-700"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, i) => (
                      <tr
                        key={i}
                        className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition"
                      >
                        {Object.values(row).map((val, j) => (
                          <td
                            key={j}
                            className="px-2 py-1 border whitespace-nowrap"
                            style={{ maxWidth: 400, overflow: 'auto', textOverflow: 'ellipsis' }}
                          >
                            {formatDate(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results.map((row, i) => (
                  <div
                    key={i}
                    className="bg-white border p-4 rounded-xl shadow text-left hover:shadow-md transition"
                  >
                    {Object.entries(row).map(([k, v], j) => (
                      <p key={j} className="mb-1">
                        <span className="font-semibold text-gray-700">{k}:</span> <span className="text-gray-900">{formatDate(v)}</span>
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <footer className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8 mb-2 w-full">
        &copy; {new Date().getFullYear()} Made by Param Yadav.
      </footer>
    </div>
  );
}

export default App;

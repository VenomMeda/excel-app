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

  const uploadFile = async () => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API_BASE}/upload/`, formData);
      alert(res.data.message);
      setSheets(res.data.sheets);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed.");
    }
  };

  const selectSheet = async () => {
    const formData = new FormData();
    formData.append("sheet_name", selectedSheet);
    try {
      const res = await axios.post(`${API_BASE}/select-sheet/`, formData);
      alert(res.data.message);
      setColumns(res.data.columns);
    } catch (err) {
      console.error("Sheet selection failed:", err);
      alert("Sheet selection failed.");
    }
  };

  const searchData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/search/`, {
        params: { field_name: selectedField, query: searchQuery },
      });
      setResults(res.data);
    } catch (err) {
      console.error("Search failed:", err);
      alert("Search failed.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Excel Data Explorer</h2>

      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={uploadFile}>Upload Excel</button>

      {sheets.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <label>Select Sheet: </label>
          <select
            value={selectedSheet}
            onChange={(e) => setSelectedSheet(e.target.value)}
          >
            <option value="">--Choose Sheet--</option>
            {sheets.map((sheet, i) => (
              <option key={i} value={sheet}>
                {sheet}
              </option>
            ))}
          </select>
          <button disabled={!selectedSheet} onClick={selectSheet}>
            Load Sheet
          </button>
        </div>
      )}

      {columns.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <label>Select Field: </label>
          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
          >
            <option value="">--Choose Field--</option>
            {columns.map((col, i) => (
              <option key={i} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedField && (
        <div style={{ marginTop: "20px" }}>
          <input
            type="text"
            placeholder={`Enter ${selectedField} to search`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button onClick={searchData}>Search</button>
        </div>
      )}

      <div style={{ marginTop: "30px" }}>
        {results.length > 0 ? (
          <table border="1" cellPadding="6">
            <thead>
              <tr>
                {Object.keys(results[0]).map((col, idx) => (
                  <th key={idx}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No results to display.</p>
        )}
      </div>
    </div>
  );
}

export default App;

import React, { useState } from "react";
import axios from "axios";

const API_BASE = "https://excel-app-backend.onrender.com";

function App() {
  const [file, setFile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [village, setVillage] = useState("");
  const [results, setResults] = useState([]);
  const [step, setStep] = useState("upload");

  const uploadFile = async () => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post(`${API_BASE}/upload/`, formData);
    if (res.data.sheets.length === 1) {
      await selectSheet(res.data.sheets[0]);
    } else {
      setSheets(res.data.sheets);
      setStep("selectSheet");
    }
  };

  const selectSheet = async (sheetName) => {
    await axios.post(`${API_BASE}/select-sheet/`, { sheet_name: sheetName });
    setSelectedSheet(sheetName);
    setStep("search");
    alert(`Sheet "${sheetName}" selected`);
  };

  const searchVillage = async () => {
    const res = await axios.get(`${API_BASE}/search/`, {
      params: { village },
    });
    setResults(res.data);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📊 Excel Data Search</h2>

      {step === "upload" && (
        <>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={uploadFile}>Upload Excel</button>
        </>
      )}

      {step === "selectSheet" && (
        <>
          <h3>Select a sheet:</h3>
          {sheets.map((sheet) => (
            <button key={sheet} onClick={() => selectSheet(sheet)}>
              {sheet}
            </button>
          ))}
        </>
      )}

      {step === "search" && (
        <>
          <input
            type="text"
            placeholder="Enter village name"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
          />
          <button onClick={searchVillage}>Search</button>

          <br />
          <br />
          {results.length > 0 && (
            <table border="1" cellPadding="5">
              <thead>
                <tr>
                  {Object.keys(results[0]).map((key) => (
                    <th key={key}>{key}</th>
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
          )}
        </>
      )}
    </div>
  );
}

export default App;

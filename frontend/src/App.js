import React, { useState } from "react";
import axios from "axios";

const API_BASE = "https://your-api.onrender.com"; // Replace with your actual Render API URL

function App() {
  const [file, setFile] = useState(null);
  const [village, setVillage] = useState("");
  const [results, setResults] = useState([]);

  const uploadFile = async () => {
    const formData = new FormData();
    formData.append("file", file);
    await axios.post(`${API_BASE}/upload/`, formData);
    alert("Uploaded successfully");
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

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={uploadFile}>Upload Excel</button>

      <br /><br />

      <input
        type="text"
        placeholder="Enter village name"
        value={village}
        onChange={(e) => setVillage(e.target.value)}
      />
      <button onClick={searchVillage}>Search</button>

      <br /><br />
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
    </div>
  );
}

export default App;

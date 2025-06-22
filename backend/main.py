# === backend/main.py ===
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import pandas as pd
import uvicorn
import os

app = FastAPI()

# Temporary store
session_data = {
    "df": None,
    "columns": [],
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload/")
async def upload_excel(file: UploadFile = File(...)):
    contents = await file.read()
    with open("temp.xlsx", "wb") as f:
        f.write(contents)

    try:
        excel_file = pd.ExcelFile("temp.xlsx")
        return {"sheets": excel_file.sheet_names}
    except Exception as e:
        return {"error": f"Failed to read Excel: {str(e)}"}

@app.post("/select-sheet/")
async def select_sheet(sheet_name: str = Form(...)):
    try:
        df = pd.read_excel("temp.xlsx", sheet_name=sheet_name)
        session_data["df"] = df
        session_data["columns"] = df.columns.tolist()
        return {"columns": session_data["columns"]}
    except Exception as e:
        return {"error": f"Failed to load sheet: {str(e)}"}

@app.get("/search/")
def search_data(filters: Optional[str] = None, columns: Optional[str] = None):
    df = session_data.get("df")
    if df is None:
        return []

    result_df = df.copy()

    if filters:
        for cond in filters.split("||"):
            try:
                field, query = cond.split(":", 1)
                if field in result_df.columns:
                    result_df = result_df[
                        result_df[field].astype(str).str.contains(query, case=False, na=False)
                    ]
            except Exception:
                continue

    if columns:
        cols = [col.strip() for col in columns.split(",") if col.strip() in result_df.columns]
        if cols:
            result_df = result_df[cols]

    return result_df.fillna("").to_dict(orient="records")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

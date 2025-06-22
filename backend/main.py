# === backend/main.py ===
from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
import pandas as pd
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploaded_df = {}

@app.post("/upload/")
async def upload_file(file: UploadFile):
    contents = await file.read()
    excel_data = pd.read_excel(io.BytesIO(contents), sheet_name=None)
    uploaded_df["excel"] = excel_data
    return {"sheets": list(excel_data.keys())}

@app.post("/select-sheet/")
async def select_sheet(sheet_name: str = Form(...)):
    if "excel" not in uploaded_df or sheet_name not in uploaded_df["excel"]:
        return JSONResponse(status_code=400, content={"error": "Sheet not found"})
    df = uploaded_df["excel"][sheet_name]
    uploaded_df["df"] = df
    return {"columns": df.columns.tolist()}

@app.get("/search/")
async def search(field_name: str, query: str, columns: Optional[str] = None):
    if "df" not in uploaded_df:
        return JSONResponse(status_code=400, content={"error": "No data loaded"})

    df = uploaded_df["df"]
    query = query.strip().lower()

    try:
        matched_df = df[df[field_name].astype(str).str.lower().str.contains(query)]
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    if columns:
        column_list = [col.strip() for col in columns.split(",") if col.strip() in matched_df.columns]
        matched_df = matched_df[column_list]

    return matched_df.fillna("").to_dict(orient="records")

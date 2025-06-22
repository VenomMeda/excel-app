# === backend/main.py ===
from fastapi import FastAPI, File, UploadFile, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

df = pd.DataFrame()

@app.post("/upload/")
async def upload(file: UploadFile = File(...)):
    global df
    contents = await file.read()
    excel_data = pd.ExcelFile(contents)
    return {"sheets": excel_data.sheet_names}

@app.post("/select-sheet/")
async def select_sheet(sheet_name: str = Form(...), file: UploadFile = File(None)):
    global df
    if file:
        contents = await file.read()
        excel_data = pd.ExcelFile(contents)
        df = excel_data.parse(sheet_name)
    else:
        df = pd.read_excel("temp.xlsx", sheet_name=sheet_name)
    return {"columns": df.columns.tolist()}

@app.get("/search/")
async def search(request: Request):
    global df
    filters: Optional[str] = request.query_params.get("filters")
    columns: Optional[str] = request.query_params.get("columns")

    if df.empty:
        return JSONResponse(status_code=400, content={"error": "No data loaded"})

    filtered_df = df.copy()

    if filters:
        try:
            for clause in filters.split("||"):
                if ":" in clause:
                    field, query = clause.split(":", 1)
                    filtered_df = filtered_df[filtered_df[field].astype(str).str.contains(query, case=False, na=False)]
        except Exception as e:
            return JSONResponse(status_code=400, content={"error": f"Invalid filter: {str(e)}"})

    if columns:
        col_list = [c.strip() for c in columns.split(",") if c.strip() in filtered_df.columns]
        if col_list:
            filtered_df = filtered_df[col_list]

    return filtered_df.fillna("").to_dict(orient="records")

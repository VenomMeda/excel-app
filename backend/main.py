from fastapi import FastAPI, File, UploadFile, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
from io import BytesIO
import numpy as np

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Globals
excel_bytes = None
excel_sheets = []
data_df = pd.DataFrame()

@app.get("/")
def read_root():
    return {"message": "Excel backend is running"}

@app.post("/upload/")
async def upload_excel(file: UploadFile = File(...)):
    global excel_bytes, excel_sheets
    excel_bytes = await file.read()
    xls = pd.ExcelFile(BytesIO(excel_bytes))
    excel_sheets = xls.sheet_names
    return {"message": "File uploaded successfully", "sheets": excel_sheets}

@app.post("/select-sheet/")
async def select_sheet(sheet_name: str = Form(...)):
    global data_df, excel_bytes
    if not excel_bytes:
        return JSONResponse(status_code=400, content={"error": "No file uploaded"})

    xls = pd.ExcelFile(BytesIO(excel_bytes))
    if sheet_name not in xls.sheet_names:
        return JSONResponse(status_code=400, content={"error": f"Sheet '{sheet_name}' not found"})

    df = xls.parse(sheet_name)
    data_df = df
    return {"message": f"Sheet '{sheet_name}' loaded", "columns": list(df.columns)}

@app.get("/search/")
def search(field_name: str = Query(...), query: str = Query(...)):
    global data_df
    if data_df.empty:
        return JSONResponse(status_code=400, content={"error": "No sheet selected or data unavailable"})

    if field_name not in data_df.columns:
        return JSONResponse(status_code=400, content={"error": f"Field '{field_name}' not found"})

    matches = data_df[
        data_df[field_name].astype(str).str.contains(query, case=False, na=False)
    ]

    # Convert all values to strings to handle datetime, NaN, etc.
    serializable_matches = matches.fillna("").astype(str).to_dict(orient="records")
    return JSONResponse(content=serializable_matches)


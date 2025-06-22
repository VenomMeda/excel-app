from fastapi import FastAPI, File, UploadFile, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
from io import BytesIO

app = FastAPI()

# Allow all origins for development purposes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to hold state
excel_bytes = None
excel_sheets = []
data_df = pd.DataFrame()

@app.get("/")
def root():
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
def search(
    field_name: str = Query(...),
    query: str = Query(...),
    columns: str = Query(default=""),
    match_type: str = Query(default="partial")  # "partial" or "exact"
):
    global data_df
    if data_df.empty:
        return JSONResponse(status_code=400, content={"error": "No sheet selected or data unavailable"})

    if field_name not in data_df.columns:
        return JSONResponse(status_code=400, content={"error": f"Field '{field_name}' not found"})

    df = data_df.copy()
    df[field_name] = df[field_name].astype(str)

    if match_type == "exact":
        matches = df[df[field_name] == query]
    else:
        matches = df[df[field_name].str.contains(query, case=False, na=False)]

    # Optional column filter
    if columns:
        requested_columns = [col.strip() for col in columns.split(",") if col.strip() in df.columns]
        matches = matches[requested_columns] if requested_columns else matches

    serializable = matches.fillna("").astype(str).to_dict(orient="records")
    return JSONResponse(content=serializable)

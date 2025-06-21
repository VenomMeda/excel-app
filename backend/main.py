from fastapi import FastAPI, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import datetime

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

storage = {"df": None}

@app.post("/upload/")
async def upload_excel(file: UploadFile = File(...)):
    contents = await file.read()
    excel_file = pd.ExcelFile(contents)
    storage["excel"] = excel_file
    return {"sheets": excel_file.sheet_names}

@app.post("/select-sheet/")
async def select_sheet(request: Request):
    sheet_name = request.query_params.get("sheet_name")
    df = pd.read_excel(storage["excel"], sheet_name=sheet_name)
    storage["df"] = df
    return {"columns": df.columns.tolist()}

@app.get("/search/")
def search(field_name: str, query: str, exact: bool = False, columns: str = ""):
    df = storage["df"]
    if exact:
        matches = df[df[field_name].astype(str) == query]
    else:
        matches = df[df[field_name].astype(str).str.contains(query, case=False, na=False)]
    
    if columns:
        col_list = columns.split(",")
        matches = matches[col_list]

    # Convert datetime and NaN
    def safe_convert(val):
        if isinstance(val, (datetime.datetime, datetime.date)):
            return val.isoformat()
        elif pd.isna(val):
            return None
        return val

    json_ready = matches.fillna(np.nan).replace({np.nan: None}).applymap(safe_convert).to_dict(orient="records")
    return JSONResponse(content=json_ready)

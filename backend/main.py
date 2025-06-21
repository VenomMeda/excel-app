from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import io
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

data_df = pd.DataFrame()
uploaded_file_content: bytes = None

class SheetName(BaseModel):
    sheet_name: str

@app.post("/upload/")
async def upload_excel(file: UploadFile = File(...)):
    global uploaded_file_content
    uploaded_file_content = await file.read()
    excel_file = pd.ExcelFile(io.BytesIO(uploaded_file_content))
    return {"sheets": excel_file.sheet_names}

@app.post("/select-sheet/")
async def select_sheet(item: SheetName):
    global data_df, uploaded_file_content
    if uploaded_file_content is None:
        return JSONResponse(status_code=400, content={"error": "No Excel uploaded"})
    excel_file = pd.ExcelFile(io.BytesIO(uploaded_file_content))
    data_df = excel_file.parse(item.sheet_name)
    return {"message": f"Sheet '{item.sheet_name}' selected successfully."}

@app.get("/search/")
def search_village(village: str = Query(...)):
    global data_df
    if data_df.empty:
        return JSONResponse(status_code=400, content={"error": "No Excel uploaded"})
    results = data_df[data_df["Village Name"].str.contains(village, case=False, na=False)]
    return results.to_dict(orient="records")

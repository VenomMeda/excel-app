from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

data_df = pd.DataFrame()

@app.post("/upload/")
async def upload_excel(file: UploadFile = File(...)):
    global data_df
    contents = await file.read()
    excel_file = pd.ExcelFile(io.BytesIO(contents))
    data_df = excel_file.parse("Data")
    return {"columns": data_df.columns.tolist(), "rows": len(data_df)}

@app.get("/search/")
def search_village(village: str = Query(...)):
    global data_df
    if data_df.empty:
        return JSONResponse(status_code=400, content={"error": "No Excel uploaded"})
    results = data_df[data_df["Village Name"].str.contains(village, case=False, na=False)]
    return results.to_dict(orient="records")

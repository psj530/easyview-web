# -*- coding: utf-8 -*-
"""
PwC Easy View 3.0 - FastAPI Backend
Serves financial data from CSV files as REST API endpoints.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import os
import shutil

from data_processor import DataProcessor

app = FastAPI(
    title="Easy View API",
    description="PwC Worldwide Easy View 3.0 Backend API",
    version="3.0.0"
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_DIR = os.path.join(BASE_DIR, "input")
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
os.makedirs(INPUT_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)

# Global data processor
processor = DataProcessor(INPUT_DIR)


@app.on_event("startup")
async def startup():
    """Load data on startup if CSV files exist."""
    processor.try_load()


# ===== Health Check =====
@app.get("/api/health")
async def health():
    return {"status": "ok", "loaded": processor.is_loaded}


# ===== Full Financial Data =====
@app.get("/api/data")
async def get_financial_data():
    """Return the complete financial dataset."""
    if not processor.is_loaded:
        raise HTTPException(status_code=404, detail="데이터가 로드되지 않았습니다. CSV 파일을 업로드해주세요.")
    return processor.data


# ===== Summary =====
@app.get("/api/summary")
async def get_summary():
    if not processor.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    return processor.data.get("summary", {})


# ===== PL (Income Statement) =====
@app.get("/api/pl")
async def get_pl():
    if not processor.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    return {
        "plItems": processor.data.get("plItems", []),
        "monthlyRevenue": processor.data.get("monthlyRevenue", {}),
        "monthlyOperatingProfit": processor.data.get("monthlyOperatingProfit", {}),
        "monthlyNetIncome": processor.data.get("monthlyNetIncome", {}),
        "monthlyGrossProfit": processor.data.get("monthlyGrossProfit", {}),
        "quarterlyPL": processor.data.get("quarterlyPL", {}),
    }


# ===== BS (Balance Sheet) =====
@app.get("/api/bs")
async def get_bs():
    if not processor.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    return {
        "bsItems": processor.data.get("bsItems", []),
        "bsTrend": processor.data.get("bsTrend", {}),
        "activityMetrics": processor.data.get("activityMetrics", {}),
    }


# ===== Sales Analysis =====
@app.get("/api/sales")
async def get_sales():
    if not processor.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    return processor.data.get("salesAnalysis", {})


# ===== Journal =====
@app.get("/api/journal")
async def get_journal():
    if not processor.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    return processor.data.get("journalSummary", {})


# ===== Scenarios =====
@app.get("/api/scenarios")
async def get_scenarios():
    if not processor.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    return processor.data.get("scenarios", {})


@app.get("/api/scenarios/{scenario_id}")
async def get_scenario(scenario_id: str):
    if not processor.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    scenarios = processor.data.get("scenarios", {})
    if scenario_id not in scenarios:
        raise HTTPException(status_code=404, detail=f"시나리오 '{scenario_id}' 없음")
    return scenarios[scenario_id]


# ===== CSV Upload =====
@app.post("/api/upload")
async def upload_csv(
    tb_file: UploadFile = File(..., description="시산표 CSV"),
    je_file: UploadFile = File(..., description="전표 CSV"),
):
    """Upload TB and JE CSV files and regenerate data."""
    try:
        # Save TB file
        tb_path = os.path.join(INPUT_DIR, "TB.csv")
        with open(tb_path, "wb") as f:
            shutil.copyfileobj(tb_file.file, f)

        # Save JE file
        je_path = os.path.join(INPUT_DIR, "JE.csv")
        with open(je_path, "wb") as f:
            shutil.copyfileobj(je_file.file, f)

        # Reprocess
        processor.load(tb_path, je_path)

        return {
            "status": "success",
            "message": "데이터가 성공적으로 업로드 및 처리되었습니다.",
            "summary": {
                "revenue": processor.data["summary"]["revenue"]["current"],
                "plItems": len(processor.data["plItems"]),
                "bsItems": len(processor.data["bsItems"]),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"처리 실패: {str(e)}")


# ===== Meta Info =====
@app.get("/api/meta")
async def get_meta():
    if not processor.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    return {
        "baseDate": processor.data.get("baseDate", ""),
        "companyName": processor.data.get("companyName", ""),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

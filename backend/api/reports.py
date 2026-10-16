# backend/api/reports.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from typing import List
from bson import ObjectId

from database.mongodb import db
from database.schemas import ReportRequest, ReportResponse, ReportDB
from rag.retriever import medical_retriever
from llm.report_generator import report_generator
from api.auth import get_current_user
from utils.pdf_generator import generate_pdf_report

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/", response_model=List[ReportDB])
async def list_reports(skip: int = 0, limit: int = 20, current_user: dict = Depends(get_current_user)):
    """List generated reports for the reports workspace."""
    reports = await db.db.reports.find().sort("_id", -1).skip(skip).limit(limit).to_list(limit)
    for report in reports:
        report["_id"] = str(report["_id"])
    return [ReportDB(**report) for report in reports]

@router.get("/{report_id}/pdf")
async def download_report_pdf(report_id: str, current_user: dict = Depends(get_current_user)):
    """Generate and download a PDF for a stored report."""
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=400, detail="Invalid report ID format")
    report = await db.db.reports.find_one({"_id": ObjectId(report_id)})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    pdf_path = generate_pdf_report(
        prediction_data={"symptoms": "Not provided", "top_predictions": []},
        rag_context=[{"metadata": {"source": reference}, "text": ""} for reference in report.get("retrieved_references", [])],
        llm_report=report.get("generated_report", ""),
        grad_cam_path=None,
    )
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"clinical_report_{report_id}.pdf")

@router.post("/generate", response_model=ReportResponse)
async def generate_clinical_report(
    request: ReportRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generates an AI clinical report using RAG context and an LLM, 
    based on the multimodal predictions and explainability data.
    """
    # 1. Retrieve Clinical Context via RAG
    try:
        rag_context = medical_retriever.retrieve_context(
            predicted_diseases=request.predictions.final_diseases,
            symptom_text=request.patient_data.get("symptoms", ""),
            top_k=3
        )
    except Exception as e:
        rag_context = []

    # 2. Generate LLM Report
    try:
        llm_output = await report_generator.generate_report(
            patient_data=request.patient_data,
            predictions=request.predictions.model_dump(),
            explainability=request.predictions.explainability.model_dump(),
            rag_context=rag_context
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Report Generation failed: {str(e)}")

    # 3. Save to Database
    patient_id = request.patient_data.get("patient_id") # Optional
    report_doc = {
        "patient_id": patient_id,
        "prediction_id": None, # Could link to a saved prediction document if implemented
        "generated_report": llm_output["generated_report"],
        "retrieved_references": llm_output["retrieved_references"],
        "disclaimer": llm_output["disclaimer"]
    }
    
    result = await db.db.reports.insert_one(report_doc)
    report_id = str(result.inserted_id)

    # 4. Return Response
    return ReportResponse(
        report_id=report_id,
        patient_id=patient_id,
        generated_report=llm_output["generated_report"],
        retrieved_references=llm_output["retrieved_references"],
        disclaimer=llm_output["disclaimer"]
    )

@router.get("/{report_id}", response_model=ReportDB)
async def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve a previously generated report by ID."""
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=400, detail="Invalid report ID format")
        
    report = await db.db.reports.find_one({"_id": ObjectId(report_id)})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    report["_id"] = str(report["_id"])
    return ReportDB(**report)
import io
import json
import logging
from typing import Any

import numpy as np
import torch
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from api.auth import get_current_user
from database.schemas import ExplainabilityResponse, PredictionResponse
from explainability.attention import TextAttentionExplainer
from explainability.gradcam import ViTGradCAM
from explainability.shap_analysis import HistorySHAPExplainer
from inference.dicom_loader import DICOMImageLoader
from inference.image_inference import image_inference
from inference.pipeline import master_pipeline

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/predict", tags=["Prediction"])


def _as_png_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def _render_pdf_first_page(pdf_bytes: bytes) -> bytes:
    import fitz
    document = fitz.open(stream=pdf_bytes, filetype="pdf")
    if document.page_count == 0:
        raise ValueError("PDF contains no pages")
    pixmap = document.load_page(0).get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
    return pixmap.tobytes("png")


@router.post("/", response_model=PredictionResponse)
async def run_multimodal_prediction(
    image: UploadFile = File(..., description="Medical image, DICOM, PDF, PNG or JPG"),
    symptom_text: str = Form(..., description="Patient symptoms"),
    patient_data_json: str = Form(..., description="Patient history JSON"),
    current_user: dict = Depends(get_current_user),
):
    """Run image, text, history and fusion inference with explainability outputs."""
    try:
        patient_data = json.loads(patient_data_json)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON format for patient_data_json") from exc

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file uploaded")

    extension = image.filename.lower().rsplit(".", 1)[-1] if image.filename and "." in image.filename else ""
    model_image_bytes = image_bytes
    try:
        if extension == "pdf":
            model_image_bytes = _render_pdf_first_page(image_bytes)
        elif extension in {"dcm", "dicom"}:
            model_image_bytes = _as_png_bytes(DICOMImageLoader.load_dicom_bytes(image_bytes)["image"])
        else:
            with Image.open(io.BytesIO(image_bytes)) as uploaded_image:
                uploaded_image.verify()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=f"Unreadable uploaded file: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to convert uploaded file: {exc}") from exc

    try:
        result = master_pipeline.run(model_image_bytes, symptom_text, patient_data)
    except Exception as exc:
        logger.exception("Multimodal inference failed")
        raise HTTPException(status_code=500, detail=f"Multimodal pipeline failed: {exc}") from exc

    fused_predictions = result["fused_prediction"]
    top_disease = max(fused_predictions, key=fused_predictions.get)
    target_class_idx = image_inference.class_names.index(top_disease)
    explanation = {"image_heatmap": "", "text_attention": [], "tabular_shap": {}}

    try:
        if image_inference.available and image_inference.model is not None:
            cam = ViTGradCAM(image_inference.model, image_inference.device)
            explanation["image_heatmap"] = cam.generate_heatmap(
                image_inference.preprocess_image(model_image_bytes),
                target_class_idx,
                model_image_bytes,
            )
    except Exception:
        logger.exception("Grad-CAM generation failed")

    try:
        explanation["text_attention"] = TextAttentionExplainer(
            master_pipeline.text_pipe.model,
            master_pipeline.text_pipe.tokenizer,
            master_pipeline.text_pipe.device,
        ).get_token_attention(symptom_text, target_class_idx)
    except Exception:
        logger.exception("Text attention generation failed")

    try:
        feature_values = master_pipeline.history_pipe.preprocess_features(patient_data)
        feature_names = [
            "age", "is_male", "is_female", "heart_rate", "systolic_bp", "diastolic_bp",
            "temperature", "spo2", "hypertension", "diabetes", "copd", "heart_failure",
            "asthma", "obesity", "smoking", "ckd", "liver_disease", "cancer", "dementia",
            "stroke", "thyroid", "none",
        ]
        explanation["tabular_shap"] = HistorySHAPExplainer(
            master_pipeline.history_pipe.model,
            background_data=np.zeros((10, master_pipeline.history_pipe.input_dim), dtype=np.float32),
            feature_names=feature_names,
            device=master_pipeline.history_pipe.device,
        ).explain_instance(feature_values, target_class_idx)
    except Exception:
        logger.exception("History attribution generation failed")

    return PredictionResponse(
        image_prediction=result["image_prediction"],
        text_prediction=result["text_prediction"],
        history_prediction=result["history_prediction"],
        fused_prediction=result["fused_prediction"],
        final_diseases=result["final_diseases"],
        confidence_score=float(result["confidence_score"]),
        explainability=ExplainabilityResponse(**explanation),
    )

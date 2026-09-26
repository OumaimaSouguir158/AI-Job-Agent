from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.schemas import CVExtractResponse
from app.services.cv_extractor import extract_cv

router = APIRouter()

@router.post("/cv", response_model=CVExtractResponse)
async def upload_cv(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    allowed = {".pdf", ".docx", ".txt"}
    ext = "." + file.filename.rsplit(".", 1)[-1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported format. Allowed: {allowed}")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    try:
        candidate, raw_text, confidence = await extract_cv(content, file.filename)
        return CVExtractResponse(candidate=candidate, raw_text=raw_text[:500], confidence=confidence)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class PipelineStage(str, Enum):
    UPLOADED = "uploaded"
    FILE_VALIDATION = "file_validation"
    PAGE_SPLITTING = "page_splitting"
    IMAGE_PREPROCESSING = "image_preprocessing"
    OCR_EXTRACTION = "ocr_extraction"
    LAYOUT_ANALYSIS = "layout_analysis"
    QUESTION_SEGMENTATION = "question_segmentation"
    MATH_RECOGNITION = "math_recognition"
    AI_STRUCTURING = "ai_structuring"
    AWAITING_MODERATION = "awaiting_moderation"
    COMPLETED = "completed"
    FAILED = "failed"


STAGE_ORDER = [
    PipelineStage.UPLOADED,
    PipelineStage.FILE_VALIDATION,
    PipelineStage.PAGE_SPLITTING,
    PipelineStage.IMAGE_PREPROCESSING,
    PipelineStage.OCR_EXTRACTION,
    PipelineStage.LAYOUT_ANALYSIS,
    PipelineStage.QUESTION_SEGMENTATION,
    PipelineStage.MATH_RECOGNITION,
    PipelineStage.AI_STRUCTURING,
    PipelineStage.AWAITING_MODERATION,
    PipelineStage.COMPLETED,
]

STAGE_PROGRESS = {
    PipelineStage.UPLOADED: 5,
    PipelineStage.FILE_VALIDATION: 10,
    PipelineStage.PAGE_SPLITTING: 20,
    PipelineStage.IMAGE_PREPROCESSING: 30,
    PipelineStage.OCR_EXTRACTION: 50,
    PipelineStage.LAYOUT_ANALYSIS: 65,
    PipelineStage.QUESTION_SEGMENTATION: 75,
    PipelineStage.MATH_RECOGNITION: 82,
    PipelineStage.AI_STRUCTURING: 90,
    PipelineStage.AWAITING_MODERATION: 95,
    PipelineStage.COMPLETED: 100,
    PipelineStage.FAILED: 0,
}


class QuestionOption(BaseModel):
    id: str
    text: str
    is_correct: bool = False


class ExtractedQuestion(BaseModel):
    id: str
    text: str
    options: list[QuestionOption] = []
    correct_answer: Optional[str] = None
    question_type: str = "structured"
    confidence: float = 0.7
    page_number: int = 1
    bounding_box: Optional[dict] = None
    math_latex: Optional[str] = None


class PageResult(BaseModel):
    page_number: int
    raw_text: str
    ocr_confidence: float = 0.0
    blocks: list[dict] = []
    questions: list[ExtractedQuestion] = []
    image_path: Optional[str] = None
    has_math: bool = False


class OCRJobResult(BaseModel):
    text: str = ""
    pages: int = 0
    confidence: float = 0.0
    questions: list[ExtractedQuestion] = []
    processing_time: int = 0
    page_results: list[PageResult] = []


class JobStatusResponse(BaseModel):
    jobId: str
    status: str
    stage: str
    progress: int
    fileName: str
    createdAt: datetime
    startedAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None
    result: Optional[OCRJobResult] = None
    error: Optional[str] = None
    stage_details: Optional[dict] = None


class UploadResponse(BaseModel):
    jobId: str
    status: str
    message: str


class JobListItem(BaseModel):
    id: str
    status: str
    stage: str
    progress: int
    fileName: str
    createdAt: datetime
    completedAt: Optional[datetime] = None

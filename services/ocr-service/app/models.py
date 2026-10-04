from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class PipelineStage(str, Enum):
    UPLOADED = "uploaded"
    FILE_VALIDATION = "file_validation"
    PAGE_SPLITTING = "page_splitting"
    IMAGE_PREPROCESSING = "image_preprocessing"
    FIGURE_EXTRACTION = "figure_extraction"
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
    PipelineStage.FIGURE_EXTRACTION,
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
    PipelineStage.FIGURE_EXTRACTION: 40,
    PipelineStage.OCR_EXTRACTION: 50,
    PipelineStage.LAYOUT_ANALYSIS: 65,
    PipelineStage.QUESTION_SEGMENTATION: 75,
    PipelineStage.MATH_RECOGNITION: 82,
    PipelineStage.AI_STRUCTURING: 90,
    PipelineStage.AWAITING_MODERATION: 95,
    PipelineStage.COMPLETED: 100,
    PipelineStage.FAILED: 0,
}


class RegionType(str, Enum):
    HEADER = "header"
    FOOTER = "footer"
    PAGE_NUMBER = "page_number"
    QUESTION = "question"
    QUESTION_NUMBER = "question_number"
    STEM = "stem"
    INSTRUCTION = "instruction"
    TEXT_BLOCK = "text_block"
    MATH_BLOCK = "math_block"
    FIGURE = "figure"
    TABLE = "table"
    DIAGRAM = "diagram"
    FORMULA = "formula"
    ANSWER_CHOICES = "answer_choices"
    ANSWER_CHOICE = "answer_choice"
    WORKING_AREA = "working_area"
    HANDWRITING = "handwriting"
    PAPER_ARTIFACT = "paper_artifact"
    UNKNOWN = "unknown"


class ChoiceLayout(str, Enum):
    INLINE = "inline"
    TWO_COLUMN = "2_column"
    VERTICAL = "vertical"
    GRID = "grid"


class PageRegion(BaseModel):
    id: str
    type: RegionType
    bbox: list[int] = Field(default_factory=list)  # [x, y, w, h] or [(x1,y1), (x2,y2)...]
    confidence: float = 1.0
    text: Optional[str] = None
    question_number: Optional[str] = None
    page_number: int = 1


class FigureAsset(BaseModel):
    id: str
    key: str
    url: str
    figure_type: str = "diagram"  # "geometry_diagram", "photo", "line_diagram", "chart"
    bbox: list[int] = Field(default_factory=list)  # [x, y, w, h]
    question_number: Optional[str] = None
    page_number: int = 1
    confidence: float = 0.95


class QuestionOption(BaseModel):
    id: str
    text: str
    is_correct: bool = False
    latex: Optional[str] = None


class ExtractedQuestion(BaseModel):
    id: str
    question_number: Optional[str] = None
    text: str
    stem: Optional[str] = None
    options: list[QuestionOption] = []
    choices_layout: str = "vertical"  # inline, 2_column, vertical, grid
    correct_answer: Optional[str] = None
    question_type: str = "mcq"  # mcq, true_false, fill_blank, structured
    confidence: float = 0.7
    confidence_breakdown: dict = Field(default_factory=dict)
    page_number: int = 1
    bounding_box: Optional[dict] = None
    math_latex: Optional[str] = None
    math_tokens: list[dict] = Field(default_factory=list)
    diagram_reference: bool = False
    diagram_description: Optional[str] = None
    figures: list[dict] = Field(default_factory=list)
    imageUrls: list[str] = Field(default_factory=list)
    source_provenance: Optional[dict] = None
    cbc_tags: Optional[dict] = None
    needs_review: bool = False
    review_reason: Optional[str] = None


class PageResult(BaseModel):
    page_number: int
    raw_text: str
    ocr_confidence: float = 0.0
    blocks: list[dict] = []
    regions: list[PageRegion] = Field(default_factory=list)
    questions: list[ExtractedQuestion] = []
    image_path: Optional[str] = None
    color_master_path: Optional[str] = None
    has_math: bool = False


class OCRJobResult(BaseModel):
    text: str = ""
    pages: int = 0
    confidence: float = 0.0
    questions: list[ExtractedQuestion] = []
    figures: list[FigureAsset] = Field(default_factory=list)
    processing_time: int = 0
    page_results: list[PageResult] = []
    is_duplicate: bool = False


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

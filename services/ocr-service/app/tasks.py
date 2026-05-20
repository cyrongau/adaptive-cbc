import time
from app.celery_app import celery_app
from app.job_store import job_store
from app.models import PipelineStage, STAGE_PROGRESS, ExtractedQuestion, PageResult
from app.storage import storage
from app.config import settings

from app.stages.file_validation import validate_file
from app.stages.page_splitting import split_pdf_to_pages, split_image_to_page
from app.stages.image_preprocessing import preprocess_image
from app.stages.ocr_extraction import extract_text_google_vision
from app.stages.layout_detection import detect_layout
from app.stages.question_segmentation import segment_questions
from app.stages.math_recognition import recognize_math
from app.stages.ai_structuring import ai_structure_questions


@celery_app.task(bind=True, name="ocr_pipeline.run")
def run_pipeline(self, job_id: str):
    start_time = time.time()

    try:
        job = job_store.get_job(job_id)
        if not job:
            return {"error": "Job not found"}

        job_store.update_job(job_id, started_at=time.time().__class__().isoformat() if hasattr(time.time(), '__class__') else "", status="processing")

        # Stage 1: File Validation
        job_store.set_stage(job_id, PipelineStage.FILE_VALIDATION, {"status": "running"})
        validation = validate_file(
            job["file_name"],
            job["mime_type"],
            0,
        )
        job_store.set_stage(job_id, PipelineStage.FILE_VALIDATION, validation)

        # Stage 2: Page Splitting
        job_store.set_stage(job_id, PipelineStage.PAGE_SPLITTING, {"status": "running"})
        if validation["is_pdf"]:
            pages = split_pdf_to_pages(job_id, job["original_key"])
        else:
            pages = split_image_to_page(job_id, job["original_key"])
        job_store.set_stage(job_id, PipelineStage.PAGE_SPLITTING, {
            "page_count": len(pages),
            "pages": pages,
        })

        # Stage 3: Image Preprocessing
        job_store.set_stage(job_id, PipelineStage.IMAGE_PREPROCESSING, {"status": "running"})
        preprocessed_pages = []
        for page_info in pages:
            result = preprocess_image(job_id, page_info["storage_key"], page_info["page_number"])
            preprocessed_pages.append({**page_info, **result})
        job_store.set_stage(job_id, PipelineStage.IMAGE_PREPROCESSING, {
            "processed_count": len(preprocessed_pages),
        })

        # Stage 4: OCR Extraction
        job_store.set_stage(job_id, PipelineStage.OCR_EXTRACTION, {"status": "running"})
        page_results = []
        full_text = ""
        total_confidence = 0.0

        for pp in preprocessed_pages:
            ocr_result = extract_text_google_vision(
                job_id,
                pp["preprocessed_key"],
                pp["page_number"],
            )
            page_results.append(ocr_result)
            full_text += f"\n--- Page {pp['page_number']} ---\n{ocr_result['raw_text']}"
            total_confidence += ocr_result["confidence"]

        avg_confidence = total_confidence / len(page_results) if page_results else 0
        job_store.set_stage(job_id, PipelineStage.OCR_EXTRACTION, {
            "pages_processed": len(page_results),
            "avg_confidence": avg_confidence,
        })

        # Stage 5: Layout Analysis
        job_store.set_stage(job_id, PipelineStage.LAYOUT_ANALYSIS, {"status": "running"})
        all_blocks = []
        for pr in page_results:
            all_blocks.extend(pr.get("blocks", []))

        layout = detect_layout(all_blocks)
        job_store.set_stage(job_id, PipelineStage.LAYOUT_ANALYSIS, layout)

        # Stage 6: Question Segmentation
        job_store.set_stage(job_id, PipelineStage.QUESTION_SEGMENTATION, {"status": "running"})
        raw_questions = segment_questions(page_results)
        job_store.set_stage(job_id, PipelineStage.QUESTION_SEGMENTATION, {
            "question_count": len(raw_questions),
        })

        # Stage 7: Math Recognition
        job_store.set_stage(job_id, PipelineStage.MATH_RECOGNITION, {"status": "running"})
        questions_dict = [q.model_dump() if hasattr(q, "model_dump") else q for q in raw_questions]
        questions_with_math = recognize_math(questions_dict)
        math_count = sum(1 for q in questions_with_math if q.get("has_math"))
        job_store.set_stage(job_id, PipelineStage.MATH_RECOGNITION, {
            "math_questions": math_count,
            "total_questions": len(questions_with_math),
        })

        # Stage 8: AI Structuring
        job_store.set_stage(job_id, PipelineStage.AI_STRUCTURING, {"status": "running"})
        import asyncio
        structured_questions = asyncio.run(ai_structure_questions(questions_with_math, full_text))
        job_store.set_stage(job_id, PipelineStage.AI_STRUCTURING, {
            "structured_count": len(structured_questions),
        })

        # Build final result
        processing_time = int(time.time() - start_time)

        question_dicts = [q.model_dump() if hasattr(q, "model_dump") else q for q in structured_questions]
        page_result_dicts = []
        for pr in page_results:
            page_result_dicts.append({
                "page_number": pr["page_number"],
                "raw_text": pr["raw_text"],
                "ocr_confidence": pr["confidence"],
                "blocks": pr.get("blocks", []),
                "has_math": any(q.get("has_math") for q in questions_with_math if q.get("page_number") == pr["page_number"]),
            })

        result = {
            "text": full_text.strip(),
            "pages": len(page_results),
            "confidence": round(avg_confidence / 100, 2) if avg_confidence > 1 else round(avg_confidence, 2),
            "questions": question_dicts,
            "processing_time": processing_time,
            "page_results": page_result_dicts,
        }

        job_store.set_completed(job_id, result)

        return {"job_id": job_id, "status": "completed", "question_count": len(structured_questions)}

    except Exception as e:
        print(f"Pipeline failed for job {job_id}: {e}")
        import traceback
        traceback.print_exc()
        job_store.set_failed(job_id, str(e))
        return {"job_id": job_id, "status": "failed", "error": str(e)}

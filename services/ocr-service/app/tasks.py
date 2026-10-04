import hashlib
import time
from datetime import datetime
from app.celery_app import celery_app
from app.job_store import job_store
from app.models import PipelineStage, STAGE_PROGRESS, ExtractedQuestion, PageResult, QuestionOption
from app.storage import storage
from app.config import settings

from app.stages.file_validation import validate_file
from app.stages.page_splitting import split_pdf_to_pages, split_image_to_page
from app.stages.image_preprocessing import preprocess_image
from app.stages.ocr_extraction import extract_text_hybrid
from app.stages.duplicate_check import check_duplicate, register_document, compute_page_hashes
from app.stages.layout_detection import detect_layout
from app.stages.question_segmentation import segment_questions
from app.stages.math_recognition import recognize_math
from app.stages.ai_structuring import ai_structure_questions
from app.stages.figure_extraction import extract_figures


@celery_app.task(bind=True, name="ocr_pipeline.run")
def run_pipeline(self, job_id: str):
    start_time = time.time()

    try:
        job = job_store.get_job(job_id)
        if not job:
            return {"error": "Job not found"}

        job_store.update_job(job_id, started_at=datetime.utcnow().isoformat(), status="processing")

        # Stage 1: File Validation
        job_store.set_stage(job_id, PipelineStage.FILE_VALIDATION, {"status": "running"})
        validation = validate_file(
            job["file_name"],
            job["mime_type"],
            0,
        )
        job_store.set_stage(job_id, PipelineStage.FILE_VALIDATION, validation)

        original_data = storage.get_object(job["original_key"])
        dup_check = check_duplicate(original_data)
        if dup_check:
            original_job = dup_check["job_data"]
            job_store.set_completed(job_id, {
                "text": original_job.get("result", {}).get("text", "Duplicate document - using existing OCR result"),
                "pages": original_job.get("result", {}).get("pages", 0),
                "confidence": original_job.get("result", {}).get("confidence", 0),
                "questions": original_job.get("result", {}).get("questions", []),
                "processing_time": 0,
                "page_results": original_job.get("result", {}).get("page_results", []),
                "is_duplicate": True,
                "original_job_id": dup_check["original_job_id"],
            })
            return {"job_id": job_id, "status": "completed", "duplicate": True, "original_job_id": dup_check["original_job_id"]}

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
            preprocessed_pages.append({
                **page_info,
                **result,
                "color_master_key": page_info.get("color_master_key") or page_info["storage_key"]
            })
        job_store.set_stage(job_id, PipelineStage.IMAGE_PREPROCESSING, {
            "processed_count": len(preprocessed_pages),
        })

        # Stage 4: Layout Intelligence Engine (Method c Vision primary, Method b Local fallback)
        job_store.set_stage(job_id, PipelineStage.LAYOUT_ANALYSIS, {"status": "running"})
        import asyncio
        from app.stages.layout_detection import detect_hybrid_layout

        all_page_questions = []
        all_page_regions = []
        all_figures = []
        page_results = []
        full_text = ""
        total_confidence = 0.0

        for pp in preprocessed_pages:
            p_num = pp["page_number"]
            master_key = pp["color_master_key"]
            prep_key = pp["preprocessed_key"]

            # Local OCR pass for TSV word positions
            local_ocr = extract_text_hybrid(job_id, prep_key, p_num)
            full_text += f"\n--- Page {p_num} ---\n{local_ocr['raw_text']}"
            total_confidence += local_ocr["confidence"]

            # Layout Analysis on this page
            layout_res = asyncio.run(detect_hybrid_layout(
                job_id=job_id,
                color_master_key=master_key,
                page_number=p_num,
                tsv_words=local_ocr.get("words", []),
                page_blocks=local_ocr.get("blocks", [])
            ))

            method_used = layout_res.get("method", "local")
            p_questions = layout_res.get("questions", [])
            p_regions = layout_res.get("regions", [])
            figure_regions = layout_res.get("figure_regions", [])

            # Stage 5: Figure Extraction from Color Master Image
            page_figs = extract_figures(
                job_id=job_id,
                color_page_key=master_key,
                page_number=p_num,
                known_figure_regions=figure_regions
            )
            all_figures.extend(page_figs)

            # Bind extracted figures to specific questions by question_number
            for q in p_questions:
                q_num = getattr(q, "question_number", None) or (q.get("question_number") if isinstance(q, dict) else "")
                q_figs = [f for f in page_figs if str(f.get("question_number", "")) == str(q_num) and q_num]
                # If no direct number match, check if question has diagram_reference or has_figure
                if not q_figs and (getattr(q, "diagram_reference", False) or (isinstance(q, dict) and q.get("has_figure"))):
                    q_figs = page_figs[:1] if len(page_figs) == 1 else page_figs

                fig_urls = [f["url"] for f in q_figs]
                if hasattr(q, "imageUrls"):
                    q.imageUrls = fig_urls
                    q.figures = q_figs
                    if fig_urls:
                        q.diagram_reference = True
                elif isinstance(q, dict):
                    q["imageUrls"] = fig_urls
                    q["figures"] = q_figs
                    if fig_urls:
                        q["diagram_reference"] = True

            all_page_questions.extend(p_questions)
            all_page_regions.extend(p_regions)

            page_results.append({
                "page_number": p_num,
                "raw_text": local_ocr["raw_text"],
                "ocr_confidence": local_ocr["confidence"],
                "blocks": local_ocr.get("blocks", []),
                "layout_method": method_used,
            })

        job_store.set_stage(job_id, PipelineStage.LAYOUT_ANALYSIS, {
            "questions_detected": len(all_page_questions),
            "regions_detected": len(all_page_regions),
        })

        # Stage 6: Figure Extraction completion status
        job_store.set_stage(job_id, PipelineStage.FIGURE_EXTRACTION, {
            "figures_extracted": len(all_figures),
            "figures": all_figures
        })

        # Stage 7: OCR & Question Segmentation status
        job_store.set_stage(job_id, PipelineStage.OCR_EXTRACTION, {
            "pages_processed": len(page_results),
            "avg_confidence": total_confidence / len(page_results) if page_results else 0.85,
        })
        job_store.set_stage(job_id, PipelineStage.QUESTION_SEGMENTATION, {
            "question_count": len(all_page_questions),
        })

        # Stage 8: Math Recognition & AI Structuring refinement if needed
        job_store.set_stage(job_id, PipelineStage.MATH_RECOGNITION, {
            "math_questions": sum(1 for q in all_page_questions if getattr(q, "math_latex", None) or (isinstance(q, dict) and q.get("math_latex"))),
            "total_questions": len(all_page_questions),
        })

        # If questions are already structured from layout engine, finalize; else run AI structuring fallback
        structured_questions = []
        if all_page_questions:
            for q in all_page_questions:
                if isinstance(q, ExtractedQuestion):
                    structured_questions.append(q)
                elif isinstance(q, dict):
                    options = [
                        o if isinstance(o, QuestionOption) else QuestionOption(
                            id=getattr(o, "id", None) or (o.get("id") if isinstance(o, dict) else ""),
                            text=getattr(o, "text", None) or (o.get("text") if isinstance(o, dict) else ""),
                            is_correct=getattr(o, "is_correct", False) or (o.get("is_correct", False) if isinstance(o, dict) else False)
                        )
                        for o in q.get("options", [])
                    ]
                    q_num = q.get("question_number", "")
                    structured_questions.append(ExtractedQuestion(
                        id=f"q_{q.get('page_number', 1)}_{q_num}",
                        question_number=q_num,
                        text=q.get("stem", q.get("text", "")),
                        stem=q.get("stem", q.get("text", "")),
                        options=options,
                        choices_layout=q.get("choices_layout", "vertical"),
                        question_type=q.get("question_type", "mcq" if options else "structured"),
                        confidence=q.get("confidence", 0.9),
                        page_number=q.get("page_number", 1),
                        math_latex=q.get("math_latex"),
                        diagram_reference=len(q.get("imageUrls", [])) > 0,
                        imageUrls=q.get("imageUrls", []),
                        figures=q.get("figures", []),
                        bounding_box=q.get("bounding_box") or ({"bbox": q["bbox"]} if "bbox" in q else None),
                    ))
        else:
            # Fallback to text AI structuring
            job_store.set_stage(job_id, PipelineStage.AI_STRUCTURING, {"status": "running"})
            structured_questions = asyncio.run(ai_structure_questions([], full_text))

        job_store.set_stage(job_id, PipelineStage.AI_STRUCTURING, {
            "structured_count": len(structured_questions),
        })

        # Build final result
        processing_time = int(time.time() - start_time)
        avg_confidence = total_confidence / len(page_results) if page_results else 0.90

        question_dicts = [q.model_dump() if hasattr(q, "model_dump") else q for q in structured_questions]
        result = {
            "text": full_text.strip(),
            "pages": len(page_results),
            "confidence": round(avg_confidence if avg_confidence <= 1.0 else avg_confidence / 100, 2),
            "questions": question_dicts,
            "figures": all_figures,
            "processing_time": processing_time,
            "page_results": page_results,
        }

        job_store.set_completed(job_id, result)

        content_hash = hashlib.sha256(original_data).hexdigest()
        register_document(content_hash, job_id)

        return {"job_id": job_id, "status": "completed", "question_count": len(structured_questions)}

    except Exception as e:
        print(f"Pipeline failed for job {job_id}: {e}")
        import traceback
        traceback.print_exc()
        job_store.set_failed(job_id, str(e))
        return {"job_id": job_id, "status": "failed", "error": str(e)}

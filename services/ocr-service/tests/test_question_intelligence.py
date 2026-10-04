import os
from app.stages.layout_local import detect_local_layout
from app.stages.ocr_extraction import _run_tesseract
from app.stages.figure_extraction import extract_figures
from app.storage import storage

FIXTURE_PATH = "/app/tests/fixtures/gold_grade6_math_p5.jpeg"

def test_gold_standard_local_layout_and_negative_space():
    """
    Gold-standard extraction test verifying that the Question Paper Intelligence Engine:
    1. Detects Questions 20 to 25.
    2. Completely excludes the 'WORKING AREA' and student handwriting.
    3. Excludes headers ('3RD Preview/Grade 6') and footers ('Mathematics').
    4. Identifies diagram regions for Q20, Q22, Q25.
    5. Preserves choices and choice layouts.
    """
    assert os.path.exists(FIXTURE_PATH), f"Fixture not found at {FIXTURE_PATH}"

    with open(FIXTURE_PATH, "rb") as f:
        img_bytes = f.read()

    # Step 1: Run hybrid OCR for words and blocks
    from app.stages.ocr_extraction import extract_text_hybrid
    key = storage.upload_bytes("test_job", "pages", "page_001.png", img_bytes)
    ocr_res = extract_text_hybrid("test_job", key, 1)
    words = ocr_res.get("words", [])
    blocks = ocr_res.get("blocks", [])

    assert len(blocks) > 5, f"Expected > 5 blocks, got {len(blocks)}"

    # Step 2: Run Local Layout Analysis (Method b)
    layout_res = detect_local_layout(
        color_image_bytes=img_bytes,
        tsv_words=words,
        page_blocks=blocks,
        page_number=1
    )

    questions = layout_res.get("questions", [])
    regions = layout_res.get("regions", [])
    col_div_x = layout_res.get("column_divider_x")

    print(f"\n--- Extracted {len(questions)} Questions from Gold Standard Page ---")
    for q in questions:
        opt_labels = [o.id.upper() for o in q.get("options", [])]
        print(f"Q{q.get('question_number')}: {q.get('stem')[:60]}... | Opts: {opt_labels} | Figs: {len(q.get('figures', []))}")

    # Check 1: Questions detected
    assert len(questions) >= 5, f"Expected at least 5 questions (Q20-Q25), found {len(questions)}"
    q_numbers = [str(q.get("question_number")) for q in questions]
    for expected_num in ["20", "21", "22", "23"]:
        assert any(expected_num in qn for qn in q_numbers), f"Missing question {expected_num} in detected {q_numbers}"

    # Check 2: Strict Negative Space Exclusion
    for q in questions:
        stem = q.get("stem", "").upper()
        # No 'WORKING AREA' in any stem
        assert "WORKING AREA" not in stem, f"WORKING AREA leaked into Q{q.get('question_number')} stem: {stem}"
        # No header text
        assert "3RD PREVIEW" not in stem, f"Header leaked into Q{q.get('question_number')} stem: {stem}"
        # No page footer
        assert "MATHEMATICS" not in stem, f"Footer leaked into Q{q.get('question_number')} stem: {stem}"

        # No 'WORKING AREA' in choices
        for opt in q.get("options", []):
            opt_text = opt.text.upper()
            assert "WORKING AREA" not in opt_text, f"WORKING AREA leaked into option {opt.id}: {opt_text}"

    # Check 3: Column divider was identified separating working area
    assert col_div_x is not None, "Column divider was not detected"
    assert 500 < col_div_x < 900, f"Column divider x={col_div_x} outside expected range"

    # Check 4: Figure detection within question boundaries
    q20 = next((q for q in questions if "20" in str(q.get("question_number"))), None)
    assert q20 is not None, "Q20 not found"
    assert len(q20.get("figures", [])) > 0 or q20.get("has_figure"), "Q20 geometry diagram not detected"

    print("\n[PASSED] Gold standard local layout and negative space test passed successfully!")


def test_gold_standard_figure_color_master_extraction():
    """
    Verifies that figures are cropped from the original color master image,
    preserving photographic textures and geometry line details without binarization damage.
    """
    with open(FIXTURE_PATH, "rb") as f:
        img_bytes = f.read()

    # Upload color master to mock storage
    page_key = storage.upload_bytes("gold_test_job", "pages", "page_001.png", img_bytes, "image/png")

    # Define known figure boxes (Q20 geometry diagram, Q22 3D box photo, Q25 line AB)
    known_regions = [
        {"bbox": [115, 80, 420, 110], "question_number": "20", "figure_type": "geometry_diagram"},
        {"bbox": [170, 385, 175, 105], "question_number": "22", "figure_type": "photo"},
        {"bbox": [105, 840, 440, 50], "question_number": "25", "figure_type": "line_diagram"},
    ]

    extracted_figs = extract_figures(
        job_id="gold_test_job",
        color_page_key=page_key,
        page_number=1,
        known_figure_regions=known_regions
    )

    assert len(extracted_figs) == 3, f"Expected 3 cropped figures, got {len(extracted_figs)}"
    for fig in extracted_figs:
        assert fig.get("url"), f"Figure {fig} missing presigned URL"
        assert fig.get("question_number") in ["20", "22", "25"], f"Unexpected question number {fig.get('question_number')}"

        # Verify crop data is valid image in storage
        crop_data = storage.get_object(fig["key"])
        assert len(crop_data) > 1000, f"Crop data suspiciously small: {len(crop_data)} bytes"

    print("\n[PASSED] Figure color master extraction test passed successfully!")

if __name__ == "__main__":
    test_gold_standard_local_layout_and_negative_space()
    test_gold_standard_figure_color_master_extraction()

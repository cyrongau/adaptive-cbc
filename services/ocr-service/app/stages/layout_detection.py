import re


def detect_layout(blocks: list[dict]) -> dict:
    questions = []
    options = []
    headers = []
    paragraphs = []
    diagrams = []

    for block in blocks:
        btype = block.get("block_type", "paragraph")
        text = block.get("text", "").strip()

        if not text:
            continue

        if btype == "numbered_question":
            questions.append(block)
        elif btype == "option":
            options.append(block)
        elif btype == "diagram_reference":
            diagrams.append(block)
        elif btype in ("short_text",):
            if len(text) < 30 and text.isupper():
                headers.append(block)
            else:
                paragraphs.append(block)
        else:
            paragraphs.append(block)

    question_groups = []
    current_question = None

    for block in blocks:
        btype = block.get("block_type", "paragraph")
        text = block.get("text", "").strip()

        if btype == "numbered_question":
            if current_question:
                question_groups.append(current_question)
            current_question = {
                "question_block": block,
                "option_blocks": [],
                "answer_block": None,
                "supplementary_blocks": [],
            }
        elif btype == "option" and current_question:
            current_question["option_blocks"].append(block)
        elif btype == "diagram_reference" and current_question:
            current_question["supplementary_blocks"].append(block)
        elif current_question and re.match(r"^(answer|key|correct|solution)[\s:]+", text, re.IGNORECASE):
            current_question["answer_block"] = block
        elif current_question:
            current_question["supplementary_blocks"].append(block)

    if current_question:
        question_groups.append(current_question)

    return {
        "total_blocks": len(blocks),
        "question_count": len(questions),
        "option_count": len(options),
        "diagram_count": len(diagrams),
        "header_count": len(headers),
        "paragraph_count": len(paragraphs),
        "question_groups": question_groups,
        "structure": "exam_paper" if len(questions) > 2 else "document",
    }

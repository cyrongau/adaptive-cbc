import re
import uuid
from app.models import ExtractedQuestion, QuestionOption


def segment_questions(page_results: list[dict]) -> list[ExtractedQuestion]:
    all_questions = []

    for page_result in page_results:
        raw_text = page_result.get("raw_text", "")
        blocks = page_result.get("blocks", [])
        page_num = page_result.get("page_number", 1)

        questions_from_page = _extract_from_text(raw_text, page_num)

        if not questions_from_page and blocks:
            questions_from_page = _extract_from_blocks(blocks, page_num)

        all_questions.extend(questions_from_page)

    return all_questions


def _extract_from_text(text: str, page_number: int) -> list[ExtractedQuestion]:
    questions = []
    lines = text.split("\n")

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        match = re.match(r"^(\d+)[\.\)\-]\s+(.+)", line)

        if match:
            q_num = int(match.group(1))
            q_text = match.group(2).strip()
            options = []
            correct_answer = None
            q_type = "structured"

            j = i + 1
            while j < len(lines):
                next_line = lines[j].strip()
                if not next_line:
                    j += 1
                    continue

                opt_match = re.match(r"^([A-Da-d])[\.\)\s]+\s*(.+)", next_line)
                answer_match = re.match(r"^(?:answer|key|correct|solution)[\s:]+([A-Da-d])", next_line, re.IGNORECASE)
                tf_match = re.match(r"^(true|false)[\s\.)]", next_line, re.IGNORECASE)
                next_q = re.match(r"^\d+[\.\)\-]", next_line)

                if answer_match:
                    correct_answer = answer_match.group(1).lower()
                    options = [
                        QuestionOption(id=o.id, text=o.text, is_correct=(o.id == correct_answer))
                        for o in options
                    ]
                    j += 1
                    continue

                if tf_match and not options:
                    is_true = tf_match.group(1).lower().startswith("t")
                    options = [
                        QuestionOption(id="a", text="True", is_correct=is_true),
                        QuestionOption(id="b", text="False", is_correct=not is_true),
                    ]
                    q_type = "true_false"
                    j += 1
                    continue

                if opt_match:
                    if not options:
                        q_type = "mcq"
                    options.append(QuestionOption(
                        id=opt_match.group(1).lower(),
                        text=opt_match.group(2).strip(),
                        is_correct=False,
                    ))
                    j += 1
                    continue

                if next_q:
                    break

                if len(next_line) > 10:
                    q_text += " " + next_line

                j += 1

            if re.search(r"_____|blank|\(\s*\)", q_text, re.IGNORECASE):
                q_type = "fill_blank"

            if not correct_answer and options:
                correct_answer = options[0].id if options else None

            questions.append(ExtractedQuestion(
                id=f"q_{uuid.uuid4().hex[:8]}",
                text=q_text,
                options=options,
                correct_answer=correct_answer,
                question_type=q_type,
                confidence=0.85 if options else 0.65,
                page_number=page_number,
            ))

            i = j
        else:
            i += 1

    return questions


def _extract_from_blocks(blocks: list[dict], page_number: int) -> list[ExtractedQuestion]:
    questions = []

    for block in blocks:
        if block.get("block_type") == "numbered_question":
            text = block.get("text", "").strip()
            match = re.match(r"^\d+[\.\)\-]\s+(.+)", text)
            q_text = match.group(1) if match else text

            questions.append(ExtractedQuestion(
                id=f"q_{uuid.uuid4().hex[:8]}",
                text=q_text,
                options=[],
                question_type="structured",
                confidence=0.6,
                page_number=page_number,
                bounding_box=block.get("bounding_box"),
            ))

    return questions

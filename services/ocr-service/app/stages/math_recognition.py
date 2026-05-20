import re


def recognize_math(questions: list[dict]) -> list[dict]:
    """
    Placeholder for Mathpix integration.
    Detects potential math expressions and marks them for later processing.
    When Mathpix API key is available, this will convert images of formulas to LaTeX.
    """
    math_patterns = [
        r"\d+\s*[\+\-\*\/\=]\s*\d+",
        r"\\[a-z]+\{[^}]*\}",
        r"\d+\s*[\^_]\s*\w+",
        r"\(?\d+/\d+\)?",
        r"\u221a",
        r"\u00b2|\u00b3|\u2070|\u00b9",
        r"\u03c0|\u03b8|\u03b1|\u03b2|\u03b3|\u0394|\u03a3",
    ]

    for q in questions:
        text = q.get("text", "")
        has_math = False

        for pattern in math_patterns:
            if re.search(pattern, text):
                has_math = True
                break

        q["has_math"] = has_math

        if has_math:
            q["math_latex"] = _basic_latex_conversion(text)

    return questions


def _basic_latex_conversion(text: str) -> str:
    result = text
    result = result.replace("\u00b2", "^{2}")
    result = result.replace("\u00b3", "^{3}")
    result = result.replace("\u221a", "\\sqrt{}")
    result = result.replace("\u00d7", "\\times ")
    result = result.replace("\u00f7", "\\div ")
    result = result.replace("\u03c0", "\\pi")
    result = result.replace("\u03b8", "\\theta")
    result = result.replace("\u03b1", "\\alpha")
    result = result.replace("\u0394", "\\Delta")
    result = result.replace("\u03a3", "\\Sigma")
    return result

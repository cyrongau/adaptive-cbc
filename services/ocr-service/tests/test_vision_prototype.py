import base64
import json
import httpx
from app.config import settings

def test_vision():
    with open('/app/tests/fixtures/gold_grade6_math_p5.jpeg', 'rb') as f:
        img_b64 = base64.b64encode(f.read()).decode('utf-8')

    prompt = """You are an expert Question Paper Understanding Engine for the Kenyan CBC curriculum.
Analyze this scanned test paper and decompose it into canonical structured questions according to the Question Paper Grammar.

Page Breakdown Rules:
1. Detect Question boundaries: Question numbers (e.g. 20, 21, 22, 23, 24, 25).
2. For each question, extract:
   - question_number: string (e.g. "20", "21")
   - stem: the question text including instructions
   - question_type: "multiple_choice" or "structured"
   - choices_layout: "inline" | "2_column" | "vertical" | "grid"
   - choices: list of { "label": "A"|"B"|"C"|"D", "content": "...", "latex": "..." (if math) }
   - has_figure: boolean (true if the question contains a diagram, geometry drawing, line, photo or illustration)
   - figure_description: short description of what the diagram shows
   - figure_bbox: [ymin, xmin, ymax, xmax] on a 0-1000 scale representing the bounding box of the diagram/drawing/photo on the page
   - math_tokens: list of LaTeX strings for fractions/equations (e.g. "6\\frac{1}{4}", "\\frac{625}{16}")
3. Negative Space & Filters:
   - EXCLUDE and IGNORE the header ("3RD Preview/Grade 6"), footer ("Mathematics", "5").
   - EXCLUDE and IGNORE the "WORKING AREA" column on the right and ANY handwritten/pencil calculations.
   - DO NOT invent, hallucinate, or add options that are not in the printed document.

Return ONLY a valid JSON object:
{
  "subject": "Mathematics",
  "grade": 6,
  "questions": [
    ...
  ]
}"""

    client = httpx.Client(timeout=60)
    resp = client.post(
        'https://openrouter.ai/api/v1/chat/completions',
        headers={'Authorization': f'Bearer {settings.OPENROUTER_API_KEY}', 'Content-Type': 'application/json'},
        json={
            'model': settings.OPENROUTER_MODEL,
            'messages': [
                {
                    'role': 'user',
                    'content': [
                        {'type': 'text', 'text': prompt},
                        {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{img_b64}'}}
                    ]
                }
            ],
            'max_tokens': 3000,
            'temperature': 0.1
        }
    )

    print('Status:', resp.status_code)
    if resp.status_code == 200:
        data = resp.json()
        content = data['choices'][0]['message']['content'].strip()
        if content.startswith('```json'):
            content = content[7:-3].strip()
        elif content.startswith('```'):
            content = content[3:-3].strip()
        parsed = json.loads(content)
        questions = parsed.get('questions', [])
        print(f'Questions extracted: {len(questions)}')
        for q in questions:
            labels = [c.get('label') for c in q.get('choices', [])]
            fig = q.get('has_figure')
            bbox = q.get('figure_bbox')
            stem = q.get('stem', '').replace('\n', ' ')[:60]
            print(f"Q{q.get('question_number')}: {stem}... | Fig: {fig} (bbox: {bbox}) | Choices ({len(labels)}): {labels}")
    else:
        print('Error:', resp.text[:400])

if __name__ == '__main__':
    test_vision()

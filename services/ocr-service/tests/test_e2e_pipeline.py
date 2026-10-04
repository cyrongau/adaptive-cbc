import requests
import time
import sys

def test_pipeline():
    url = "http://localhost:8003/upload"
    fixture = "/app/tests/fixtures/gold_grade6_math_p5.jpeg"
    with open(fixture, "rb") as f:
        files = {"file": ("gold_test.jpeg", f, "image/jpeg")}
        res = requests.post(url, files=files)
    
    print("Upload status:", res.status_code)
    data = res.json()
    print("Upload response:", data)
    job_id = data.get("jobId") or data.get("job_id")
    assert job_id, "No job_id returned"

    for i in range(45):
        s = requests.get(f"http://localhost:8003/status/{job_id}").json()
        status = s.get("status")
        stage = s.get("stage")
        progress = s.get("progress")
        print(f"[{i}] Status: {status} | Stage: {stage} | Progress: {progress}%")
        
        if status == "completed":
            result = s.get("result", {})
            questions = result.get("questions", [])
            figures = result.get("figures", [])
            print(f"\nSUCCESS! Completed in stage: {stage}")
            print(f"Total questions extracted: {len(questions)}")
            print(f"Total figures extracted: {len(figures)}")
            for q in questions:
                opts = [o.get("id") for o in q.get("options", [])]
                print(f"  Q{q.get('question_number')}: {q.get('text', '')[:50]}... | Options: {opts} | Figs: {len(q.get('figures', []))}")
            sys.exit(0)
        elif status == "failed":
            print(f"FAILED: {s.get('error')}")
            sys.exit(1)
        time.sleep(2)

    print("TIMED OUT waiting for OCR pipeline")
    sys.exit(1)

if __name__ == "__main__":
    test_pipeline()

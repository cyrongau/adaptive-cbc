import cv2
import numpy as np
from app.storage import storage
import uuid

def extract_figures(job_id: str, page_key: str, page_number: int) -> list[dict]:
    # 1. Download image
    data = storage.get_object(page_key)
    nparr = np.frombuffer(data, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        return []
    
    # 2. Preprocess for contour detection
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Thresholding
    _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
    
    # Dilation to group text and lines
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
    dilated = cv2.dilate(thresh, kernel, iterations=2)
    
    # Find contours
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    height, width = image.shape[:2]
    min_area = (width * height) * 0.005  # Minimum 0.5% of page area
    max_area = (width * height) * 0.8   # Maximum 80% of page area
    
    figures = []
    
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        area = w * h
        
        # Filter by area and aspect ratio to ignore long thin lines or tiny dots
        aspect_ratio = float(w) / h
        if min_area < area < max_area and 0.05 < aspect_ratio < 20:
            # We assume it's a figure if it's large enough. 
            # (Note: Text blocks can also be large if grouped, but typically questions are separated.
            # A more robust check could calculate edge density, but this is a solid heuristic).
            
            crop = image[y:y+h, x:x+w]
            
            # Encode as PNG
            is_success, buffer = cv2.imencode(".png", crop)
            if not is_success:
                continue
                
            file_name = f"page_{page_number:03d}_fig_{uuid.uuid4().hex[:6]}.png"
            key = storage.upload_bytes(job_id, "figures", file_name, buffer.tobytes(), "image/png")
            url = storage.get_presigned_url(key)
            
            figures.append({
                "key": key,
                "url": url,
                "bounding_box": [(x, y), (x+w, y), (x+w, y+h), (x, y+h)],
                "page_number": page_number
            })
            
    # Sort figures top-to-bottom
    figures.sort(key=lambda f: f["bounding_box"][0][1])
    return figures

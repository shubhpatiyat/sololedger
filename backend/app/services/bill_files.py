import io
import shutil
from functools import lru_cache
from pathlib import Path

import fitz
import numpy as np
from paddleocr import PaddleOCR
from PIL import Image

from app.core.config import settings


def ensure_bill_storage_dir() -> Path:
    storage_dir = Path(settings.local_bill_storage_dir).expanduser().resolve()
    storage_dir.mkdir(parents=True, exist_ok=True)
    return storage_dir


def save_uploaded_bill_file(
    *,
    owner_id: str,
    conversation_id: str,
    upload_id: str,
    original_file_name: str,
    file_stream,
) -> Path:
    suffix = Path(original_file_name).suffix or ""
    storage_dir = ensure_bill_storage_dir() / owner_id / conversation_id
    storage_dir.mkdir(parents=True, exist_ok=True)
    destination = storage_dir / f"{upload_id}{suffix.lower()}"
    with destination.open("wb") as output:
        shutil.copyfileobj(file_stream, output)
    return destination


@lru_cache
def get_paddle_ocr() -> PaddleOCR:
    return PaddleOCR(use_angle_cls=True, lang="en")


def _ocr_image(image: Image.Image) -> str:
    ocr = get_paddle_ocr()
    result = ocr.ocr(np.array(image), cls=True)
    lines: list[str] = []
    for page in result or []:
        for item in page or []:
            if len(item) >= 2 and item[1]:
                text = str(item[1][0]).strip()
                if text:
                    lines.append(text)
    return "\n".join(lines)


def extract_text_from_bill_file(file_path: str) -> str:
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        document = fitz.open(path)
        try:
            text_chunks: list[str] = []
            for page in document[: min(2, len(document))]:
                pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
                image = Image.open(io.BytesIO(pixmap.tobytes("png")))
                page_text = _ocr_image(image)
                if page_text:
                    text_chunks.append(page_text)
            return "\n".join(text_chunks)
        finally:
            document.close()

    with Image.open(path) as image:
        return _ocr_image(image.convert("RGB"))

import re

def clean_header(header: str) -> str:
    if not header:
        return ""
    # Remove special characters and extra spaces, keep alphanumeric and underscores
    # Also handle None
    s = str(header).strip()
    s = re.sub(r'[^\w\s]', '', s)
    s = re.sub(r'\s+', '_', s)
    return s.lower()

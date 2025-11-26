from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class SheetData(BaseModel):
    name: str
    headers: List[str]
    rows: List[Dict[str, Any]]

class WorkbookData(BaseModel):
    file_id: Optional[str] = None
    sheets: Dict[str, SheetData]

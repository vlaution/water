from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from fastapi.encoders import jsonable_encoder
from backend.parser.core import SheetParser
from backend.parser.models import WorkbookData
from backend.calculations.core import ValuationEngine
from backend.calculations.models import ValuationInput
from backend.database.models import get_db, ValuationRun, User
from backend.auth.dependencies import get_current_user
from backend.services.audit_service import AuditLogger
from sqlalchemy.orm import Session
import shutil
import os
import uuid
from pydantic import BaseModel
from typing import Dict, List, Optional
import json
from io import BytesIO
from fastapi import Request
from backend.services.financial_data.factory import FinancialDataFactory
from backend.services.wacc.service import WaccCalculatorService
from backend.utils.limiter import limiter
from backend.services.benchmarking_service import BenchmarkingService
from backend.calculations.benchmarking_models import BenchmarkResponse
from backend.services.auditing_service import AuditingService
from backend.calculations.models import AuditIssue
from backend.services.real_options_service import RealOptionsService
from backend.calculations.real_options_models import RealOptionsRequest, RealOptionsResult
from backend.calculations.models import PWSARequest, PWSAResult, GenerateScenarioResponse
from backend.services.peer_finding_service import PeerFindingService
from backend.services.report_generator_service import ReportGeneratorService
from backend.services.scenario_generator import ScenarioGeneratorService
from backend.services.dashboard_service import DashboardService
from backend.services.dashboard_config_service import DashboardConfigService
from backend.api.dashboard_models import ExecutiveViewResponse, FinanceViewResponse, StrategyViewResponse, InvestorViewResponse, DashboardConfig, OverviewViewResponse
from fastapi.responses import HTMLResponse
from backend.utils.cache import cache

def get_dashboard_service(db: Session = Depends(get_db)) -> DashboardService:
    return DashboardService(db)

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(('.xlsx', '.xlsm')):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .xlsx and .xlsm are supported.")
    
    file_id = str(uuid.uuid4())
    file_path = os.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        parser = SheetParser(file_path)
        workbook_data = parser.parse()
        workbook_data.file_id = file_id
        return workbook_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing file: {str(e)}")

class RunValuationRequest(BaseModel):
    mappings: Dict[str, str]

from fastapi.responses import JSONResponse
from backend.services.data_import.excel_processor import ExcelProcessor
from backend.calculations.models import ValidationErrorResponse

@router.post("/run/{file_id}")
async def run_valuation(
    file_id: str, 
    request: RunValuationRequest, 
    req: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find the uploaded file
    file_path = None
    for filename in os.listdir(UPLOAD_DIR):
        if filename.startswith(file_id):
            file_path = os.path.join(UPLOAD_DIR, filename)
            break
    
    if not file_path:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Re-parse the file
    parser = SheetParser(file_path)
    workbook_data = parser.parse()
    workbook_data.file_id = file_id
    
    # Process Excel Data
    processor = ExcelProcessor(workbook_data, request.mappings)
    valuation_input, errors = processor.process()
    
    # Check for critical errors
    critical_errors = [e for e in errors if e.severity == "error"]
    if critical_errors:
        return JSONResponse(
            status_code=400,
            content=jsonable_encoder(ValidationErrorResponse(details=errors))
        )
    
    if not valuation_input:
         return JSONResponse(
            status_code=400,
            content=jsonable_encoder(ValidationErrorResponse(details=[
                {"field": "general", "value": None, "message": "Failed to generate valuation input", "severity": "error"}
            ]))
        )

    # Run valuation
    engine = ValuationEngine(user_id=current_user.id)
    results = engine.calculate(valuation_input)
    
    # Add any non-critical validation warnings to results
    results["validation_warnings"] = [e.dict() for e in errors if e.severity == "warning"]
    
    # Save to database with user association
    run_id = str(uuid.uuid4())
    db_run = ValuationRun(
        id=run_id,
        company_name=results.get("input_summary", {}).get("company_name", "Unknown"),
        mode="upload",
        input_data=json.dumps(jsonable_encoder(results.get("input_summary", {}))),
        results=json.dumps(jsonable_encoder(results)),
        user_id=current_user.id  # Link to authenticated user
    )
    db.add(db_run)
    db.commit()
    
    # Add run_id to results
    results["run_id"] = run_id
    
    # Audit Log
    try:
        audit_logger = AuditLogger(db)
        audit_logger.log_valuation_change(
            user_id=current_user.id,
            valuation_id=run_id,
            action="created_upload",
            ip_address=req.client.host
        )
    except Exception as e:
        print(f"Audit log failed: {e}")

    return results

@router.post("/calculate")
async def calculate_valuation_manual(
    input_data: ValuationInput, 
    background_tasks: BackgroundTasks,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    auditing_service: AuditingService = Depends(AuditingService)
):
    # Run Audit
    audit_issues = await auditing_service.audit_valuation_input(input_data)

    engine = ValuationEngine(user_id=current_user.id)
    try:
        from fastapi.concurrency import run_in_threadpool
        results = await run_in_threadpool(engine.calculate, input_data)
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        import traceback
        traceback.print_exc() # Log to server console
        raise HTTPException(status_code=500, detail=f"Calculation Engine Error: {str(e)}")
    
    # Add audit issues to results
    results["audit_issues"] = [issue.dict() for issue in audit_issues]
    
    # Trigger Precomputation
    if "cache_key" in results:
        background_tasks.add_task(engine.precompute_sensitivities, input_data, results["cache_key"])

    # Save to database
    run_id = str(uuid.uuid4())
    db_run = ValuationRun(
        id=run_id,
        company_name=input_data.company_name,
        mode="manual",
        input_data=json.dumps(jsonable_encoder(input_data.dict())),
        results=json.dumps(jsonable_encoder(results)),
        user_id=current_user.id
    )
    db.add(db_run)
    db.commit()
    
    # Add run_id to results
    results["run_id"] = run_id
    
    # Audit Log
    try:
        audit_logger = AuditLogger(db)
        audit_logger.log_valuation_change(
            user_id=current_user.id,
            valuation_id=run_id,
            action="created_manual",
            ip_address=request.client.host
        )
    except Exception as e:
        print(f"Audit log failed: {e}")

    return results

@router.get("/runs")
async def get_recent_runs(limit: int = 10, db: Session = Depends(get_db)):
    runs = db.query(ValuationRun).order_by(ValuationRun.created_at.desc()).limit(limit).all()
    return [{
        "id": run.id,
        "company_name": run.company_name,
        "mode": run.mode,
        "created_at": run.created_at.isoformat(),
        "enterprise_value": json.loads(run.results).get("enterprise_value")
    } for run in runs]

@router.get("/runs/{run_id}")
async def get_run_details(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    return {
        "id": run.id,
        "company_name": run.company_name,
        "mode": run.mode,
        "created_at": run.created_at.isoformat(),
        "input_data": json.loads(run.input_data),
        "results": json.loads(run.results)
    }

from fastapi.responses import StreamingResponse
from backend.utils.excel_export import create_valuation_excel
from backend.reporting.pdf_generator import PDFGenerator
from backend.reporting.word_generator import WordGenerator
from backend.reporting.ppt_generator import PPTGenerator

@router.get("/export/{run_id}")
async def export_run_to_excel(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Prepare data for Excel export
    run_data = {
        "company_name": run.company_name,
        "mode": run.mode,
        "created_at": run.created_at.isoformat(),
        "input_data": run.input_data,
        "results": run.results
    }
    
    # Generate Excel file
    excel_file = create_valuation_excel(run_data)
    
    # Return as downloadable file
    filename = f"valuation_{run.company_name.replace(' ', '_')}_{run_id[:8]}.xlsx"
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/pdf/{run_id}")
async def export_run_to_pdf(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    results = json.loads(run.results)
    
    generator = PDFGenerator()
    pdf_file = generator.generate_executive_summary(results, run_id)
    
    filename = f"Executive_Summary_{run.company_name.replace(' ', '_')}_{run_id[:8]}.pdf"
    
    return StreamingResponse(
        BytesIO(pdf_file),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/word/{run_id}")
async def export_run_to_word(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    results = json.loads(run.results)
    
    generator = WordGenerator()
    word_file = generator.generate_analyst_report(results, run_id)
    
    filename = f"Analyst_Report_{run.company_name.replace(' ', '_')}_{run_id[:8]}.docx"
    
    return StreamingResponse(
        BytesIO(word_file),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/ppt/{run_id}")
async def export_run_to_ppt(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    results = json.loads(run.results)
    
    generator = PPTGenerator()
    ppt_file = generator.generate_presentation(results, run_id)
    
    filename = f"Valuation_Presentation_{run.company_name.replace(' ', '_')}_{run_id[:8]}.pptx"
    
    return StreamingResponse(
        BytesIO(ppt_file),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/api/financials/{ticker}")
@limiter.limit("5/minute")
async def get_financials(ticker: str, request: Request):
    try:
        provider = FinancialDataFactory.get_provider()
        data = provider.get_financials(ticker)
        return data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/market-data/{ticker}")
@limiter.limit("10/minute")
async def get_market_data(
    ticker: str, 
    request: Request,
    service: WaccCalculatorService = Depends(WaccCalculatorService)
):
    try:
        data = service.get_market_data(ticker)
        return data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class BenchmarkRequest(BaseModel):
    ticker: str
    peer_tickers: Optional[List[str]] = None
    use_sector_average: bool = False

@router.post("/api/benchmark", response_model=BenchmarkResponse)
@limiter.limit("5/minute")
async def get_benchmark_data(
    request: Request,
    payload: BenchmarkRequest,
    service: BenchmarkingService = Depends(BenchmarkingService)
):
    try:
        return service.get_comparison(
            target_ticker=payload.ticker,
            peer_tickers=payload.peer_tickers,
            use_sector=payload.use_sector_average
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/api/audit/assumptions', response_model=List[AuditIssue])
@limiter.limit('20/minute')
async def audit_assumptions(
    request: Request,
    input_data: ValuationInput,
    service: AuditingService = Depends(AuditingService)
):
    try:
        return await service.audit_valuation_input(input_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Save to database
    run_id = str(uuid.uuid4())
    db_run = ValuationRun(
        id=run_id,
        company_name=input_data.company_name,
        mode="manual",
        input_data=json.dumps(jsonable_encoder(input_data.dict())),
        results=json.dumps(jsonable_encoder(results)),
        user_id=int(current_user["id"])
    )
    db.add(db_run)
    db.commit()
    
    # Add run_id to results
    results["run_id"] = run_id
    return results

@router.get("/runs")
async def get_recent_runs(limit: int = 10, db: Session = Depends(get_db)):
    runs = db.query(ValuationRun).order_by(ValuationRun.created_at.desc()).limit(limit).all()
    return [{
        "id": run.id,
        "company_name": run.company_name,
        "mode": run.mode,
        "created_at": run.created_at.isoformat(),
        "enterprise_value": json.loads(run.results).get("enterprise_value")
    } for run in runs]

@router.get("/runs/{run_id}")
async def get_run_details(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    return {
        "id": run.id,
        "company_name": run.company_name,
        "mode": run.mode,
        "created_at": run.created_at.isoformat(),
        "input_data": json.loads(run.input_data),
        "results": json.loads(run.results)
    }

from fastapi.responses import StreamingResponse
from backend.utils.excel_export import create_valuation_excel
from backend.reporting.pdf_generator import PDFGenerator
from backend.reporting.word_generator import WordGenerator
from backend.reporting.ppt_generator import PPTGenerator

@router.get("/export/{run_id}")
async def export_run_to_excel(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Prepare data for Excel export
    run_data = {
        "company_name": run.company_name,
        "mode": run.mode,
        "created_at": run.created_at.isoformat(),
        "input_data": run.input_data,
        "results": run.results
    }
    
    # Generate Excel file
    excel_file = create_valuation_excel(run_data)
    
    # Return as downloadable file
    filename = f"valuation_{run.company_name.replace(' ', '_')}_{run_id[:8]}.xlsx"
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/pdf/{run_id}")
async def export_run_to_pdf(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    results = json.loads(run.results)
    
    generator = PDFGenerator()
    pdf_file = generator.generate_executive_summary(results, run_id)
    
    filename = f"Executive_Summary_{run.company_name.replace(' ', '_')}_{run_id[:8]}.pdf"
    
    return StreamingResponse(
        BytesIO(pdf_file),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/word/{run_id}")
async def export_run_to_word(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    results = json.loads(run.results)
    
    generator = WordGenerator()
    word_file = generator.generate_analyst_report(results, run_id)
    
    filename = f"Analyst_Report_{run.company_name.replace(' ', '_')}_{run_id[:8]}.docx"
    
    return StreamingResponse(
        BytesIO(word_file),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/ppt/{run_id}")
async def export_run_to_ppt(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    results = json.loads(run.results)
    
    generator = PPTGenerator()
    ppt_file = generator.generate_presentation(results, run_id)
    
    filename = f"Valuation_Presentation_{run.company_name.replace(' ', '_')}_{run_id[:8]}.pptx"
    
    return StreamingResponse(
        BytesIO(ppt_file),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )



@router.post("/api/benchmark", response_model=BenchmarkResponse)
@limiter.limit("5/minute")
async def get_benchmark_data(
    request: Request,
    payload: BenchmarkRequest,
    service: BenchmarkingService = Depends(BenchmarkingService)
):
    try:
        return service.get_comparison(
            target_ticker=payload.ticker,
            peer_tickers=payload.peer_tickers,
            use_sector=payload.use_sector_average
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/api/audit/assumptions', response_model=List[AuditIssue])
@limiter.limit('20/minute')
async def audit_assumptions(
    request: Request,
    input_data: ValuationInput,
    service: AuditingService = Depends(AuditingService)
):
    try:
        return await service.audit_valuation_input(input_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class GenerateScenarioRequest(BaseModel):
    base_assumptions: ValuationInput
    scenario_type: str
    intensity: float = 1.0

@router.post("/api/scenarios/generate", response_model=GenerateScenarioResponse)
async def generate_scenario(request: GenerateScenarioRequest):
    service = ScenarioGeneratorService()
    try:
        result = service.generate_scenario(
            request.base_assumptions, 
            request.scenario_type, 
            request.intensity
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# AI Summary Endpoint
from backend.services.ai_report_service import AIReportService

class AISummaryResponse(BaseModel):
    summary: str

@router.post("/api/reports/ai-summary/{run_id}", response_model=AISummaryResponse)
@limiter.limit("5/minute")
async def generate_ai_summary(
    run_id: str, 
    request: Request,
    db: Session = Depends(get_db)
):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    try:
        results = json.loads(run.results)
        service = AIReportService()
        summary = service.generate_executive_summary(results, run.company_name)
        return AISummaryResponse(summary=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Monte Carlo Endpoint
from backend.calculations.monte_carlo_models import MonteCarloRequest, MonteCarloResult
from backend.services.monte_carlo_service import MonteCarloService

@router.post("/api/monte-carlo/simulate", response_model=MonteCarloResult)
async def run_monte_carlo_simulation(request: MonteCarloRequest):
    try:
        service = MonteCarloService()
        return service.run_simulation(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/audit/assumptions", response_model=List[AuditIssue])
async def audit_assumptions(
    input_data: ValuationInput,
    auditing_service: AuditingService = Depends(AuditingService)
):
    try:
        return await auditing_service.audit_valuation_input(input_data)
    except Exception as e:
        # Log the error but return empty list or raise 500
        print(f"Audit failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# M&A Analysis Endpoint
from backend.calculations.merger_models import MergerAnalysisRequest, MergerAnalysisResult
from backend.services.merger_service import MergerAnalysisService

@router.post("/api/merger/analyze", response_model=MergerAnalysisResult)
async def analyze_merger(request: MergerAnalysisRequest):
    try:
        service = MergerAnalysisService() # Inject dependencies if needed
        result = await service.analyze_deal(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/valuation/pwsa", response_model=PWSAResult)
async def calculate_pwsa(request: PWSARequest):
    try:
        engine = ValuationEngine(workbook_data=None, mappings=None) # Initialize empty engine
        result = engine.calculate_pwsa(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/peers/{ticker}")
async def get_peers(ticker: str, sector: Optional[str] = None):
    try:
        # 1. Find Peers
        peer_service = PeerFindingService()
        peers = peer_service.find_peers(ticker, sector)
        
        # 2. Get Multiples for each peer
        results = []
        
        for peer in peers:
            metrics = peer_service.get_company_metrics(peer)
            if metrics:
                # Calculate multiples from seed data
                ev = metrics["market_cap"] # Proxy for EV in seed data
                rev = metrics["revenue"]
                ebitda = metrics["ebitda"]
                
                results.append({
                    "ticker": peer,
                    "ev_revenue": ev / rev if rev else 0,
                    "ev_ebitda": ev / ebitda if ebitda else 0,
                    "market_cap": metrics["market_cap"]
                })
                
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/export/report/{run_id}", response_class=HTMLResponse)
async def export_report(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
        
    try:
        run_data = {
            "results": json.loads(run.results),
            "input_data": json.loads(run.input_data)
        }
        
        service = ReportGeneratorService()
        html_content = service.generate_report(run_data, run.company_name)
        
        return html_content
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/valuation/sensitivity/{cache_key}")
async def get_precomputed_sensitivity(cache_key: str):
    """
    Get precomputed sensitivity matrix from cache
    """
    result = await cache.get(f"sensitivity_{cache_key}")
    if not result:
        # If not found, it might be computing or expired
        return {"status": "pending", "message": "Sensitivity analysis not ready or expired"}
    return result

# Dashboard Endpoints

from backend.services.dashboard_models import PortfolioViewResponse

@router.get("/api/dashboard/portfolio", response_model=PortfolioViewResponse)
async def get_portfolio_dashboard(
    current_user: User = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    """
    Get aggregated portfolio-level dashboard data.
    """
    return dashboard_service.get_portfolio_view()

from backend.services.dashboard_models import (
    PortfolioViewResponse, PortfolioSummary, ValuationHeatmapItem, AcquisitionPotentialItem, 
    ValuationTimelineItem, RiskMatrixItem
)
from backend.utils.cache import cached

@router.get("/api/dashboard/portfolio/summary", response_model=PortfolioSummary)
@cached(expire=300)
async def get_portfolio_summary(
    comparison_days: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    return dashboard_service.get_portfolio_summary(comparison_days=comparison_days)

@router.get("/api/dashboard/portfolio/heatmap", response_model=List[ValuationHeatmapItem])
async def get_portfolio_heatmap(
    limit: int = 100,
    sector: Optional[str] = None,
    region: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    return dashboard_service.get_portfolio_heatmap(limit=limit, sector=sector, region=region)

@router.get("/api/dashboard/portfolio/acquisition-potential", response_model=List[AcquisitionPotentialItem])
async def get_acquisition_potential(
    current_user: User = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    return dashboard_service.get_acquisition_potential()

@router.get("/api/dashboard/portfolio/timeline", response_model=List[ValuationTimelineItem])
async def get_portfolio_timeline(
    current_user: User = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    return dashboard_service.get_portfolio_timeline()

@router.get("/api/dashboard/portfolio/risk-matrix", response_model=List[RiskMatrixItem])
async def get_risk_matrix(
    current_user: User = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    return dashboard_service.get_risk_matrix()

@router.get("/api/dashboard/executive", response_model=ExecutiveViewResponse)
async def get_executive_dashboard(
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    return service.get_executive_view()

@router.get("/api/dashboard/finance/{run_id}", response_model=FinanceViewResponse)
async def get_finance_dashboard(
    run_id: str,
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    try:
        return service.get_finance_view(run_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/api/dashboard/strategy/{run_id}", response_model=StrategyViewResponse)
async def get_strategy_dashboard(
    run_id: str,
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    try:
        return service.get_strategy_view(run_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/api/dashboard/investor/{run_id}", response_model=InvestorViewResponse)
async def get_investor_dashboard(
    run_id: str,
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    try:
        return service.get_investor_view(run_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/api/dashboard/overview/{run_id}", response_model=OverviewViewResponse)
async def get_overview_dashboard(
    run_id: str,
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    try:
        return service.get_overview_view(run_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/api/dashboard/config", response_model=DashboardConfig)
async def get_dashboard_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = DashboardConfigService(db)
    return service.get_config(current_user.id)

@router.post("/api/dashboard/config", response_model=DashboardConfig)
async def save_dashboard_config(
    config: DashboardConfig,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = DashboardConfigService(db)
    return service.save_config(current_user.id, config)

@router.post("/api/real-options/calculate", response_model=RealOptionsResult)
async def calculate_real_options(request: RealOptionsRequest, db: Session = Depends(get_db)):
    service = RealOptionsService()
    try:
        result = await service.calculate_option_value(request, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


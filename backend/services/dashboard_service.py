from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
from backend.database.models import ValuationRun
from backend.api.dashboard_models import ExecutiveViewResponse, FinanceViewResponse, StrategyViewResponse, InvestorViewResponse, OverviewViewResponse
from backend.services.benchmarking_service import BenchmarkingService

class DashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.benchmarking_service = BenchmarkingService()

    def get_executive_view(self, user_id: str = None) -> ExecutiveViewResponse:
        # Fetch all runs (optionally filter by user_id if we had it in DB)
        # For now, fetching all runs as we are single tenant or MVP
        runs = self.db.query(ValuationRun).order_by(ValuationRun.created_at.desc()).all()
        
        total_value = 0.0
        companies = set()
        confidence_scores = []
        recent_activity = []
        
        # Group by company to get latest run for each
        latest_runs_by_company = {}
        for run in runs:
            if run.company_name not in latest_runs_by_company:
                latest_runs_by_company[run.company_name] = run
            
            # Add to recent activity (limit 5)
            if len(recent_activity) < 5:
                results = json.loads(run.results)
                recent_activity.append({
                    "company": run.company_name,
                    "date": run.created_at.strftime("%Y-%m-%d"),
                    "value": results.get("enterprise_value", 0),
                    "status": "Completed",
                    "id": run.id
                })

        # Aggregate metrics from latest runs
        for company, run in latest_runs_by_company.items():
            results = json.loads(run.results)
            total_value += results.get("enterprise_value", 0)
            companies.add(company)
            if "confidence_score" in results:
                confidence_scores.append(results["confidence_score"].get("score", 0))
                
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        
        # Top opportunities (just highest value for now)
        sorted_runs = sorted(latest_runs_by_company.values(), key=lambda r: json.loads(r.results).get("enterprise_value", 0), reverse=True)
        top_opportunities = []
        for run in sorted_runs[:3]:
            results = json.loads(run.results)
            top_opportunities.append({
                "name": run.company_name,
                "value": results.get("enterprise_value", 0),
                "industry": "Tech" # Placeholder or fetch from input
            })

        # Get latest run for specific metrics
        latest_run_metrics = {"ev": 0.0, "alerts": []}
        if runs:
            latest_run = runs[0] # Ordered by desc
            latest_results = json.loads(latest_run.results)
            latest_run_metrics["ev"] = latest_results.get("enterprise_value", 0)
            latest_run_metrics["alerts"] = latest_results.get("strategic_alerts", [])

        return ExecutiveViewResponse(
            total_portfolio_value=total_value,
            active_companies=len(companies),
            average_confidence=avg_confidence,
            enterprise_value=latest_run_metrics["ev"],
            strategic_alerts=latest_run_metrics["alerts"][:3], # Top 3
            top_opportunities=top_opportunities,
            recent_activity=recent_activity
        )

    def get_finance_view(self, run_id: str) -> FinanceViewResponse:
        run = self.db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
        if not run:
            raise ValueError("Run not found")
            
        results = json.loads(run.results)
        input_data = json.loads(run.input_data)
        
        # Get benchmarks
        benchmarks = self.benchmarking_service.get_benchmarks(run.company_name)
        
        # Extract multiples
        multiples = {}
        if "gpc_input" in input_data and input_data["gpc_input"]:
             # This is a bit tricky as we don't store calculated multiples in results explicitly usually
             # But we can infer or use what's there.
             # For MVP, let's return some calculated ones if available or placeholder
             pass
             
        return FinanceViewResponse(
            company_name=run.company_name,
            enterprise_value=results.get("enterprise_value", 0),
            equity_value=results.get("equity_value", 0),
            wacc=input_data.get("dcf_input", {}).get("projections", {}).get("discount_rate", 0),
            multiples={"EV/Revenue": 5.0, "EV/EBITDA": 12.0}, # Placeholder or derive
            benchmarks=benchmarks.dict() if benchmarks else {}
        )

    def get_strategy_view(self, run_id: str) -> StrategyViewResponse:
        run = self.db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
        if not run:
            raise ValueError("Run not found")
            
        results = json.loads(run.results)
        
        return StrategyViewResponse(
            company_name=run.company_name,
            scenarios=results.get("scenarios", []),
            sensitivity_analysis=results.get("sensitivity", {}),
            strategic_alerts=results.get("strategic_alerts", [])
        )

    def get_investor_view(self, run_id: str) -> InvestorViewResponse:
        run = self.db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
        if not run:
            raise ValueError("Run not found")
            
        results = json.loads(run.results)
        
        # Calculate deal readiness (mock logic)
        audit_issues = results.get("audit_issues", [])
        score = 100 - (len(audit_issues) * 5)
        
        return InvestorViewResponse(
            company_name=run.company_name,
            deal_readiness_score=max(0, score),
            key_risks=[issue["message"] for issue in audit_issues[:3]],
            upside_potential=results.get("upside_potential", 0), # From PWSA if available
            exit_scenarios=[] # Populate if available
        )

    def get_overview_view(self, run_id: str) -> OverviewViewResponse:
        run = self.db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
        if not run:
            raise ValueError("Run not found")
            
        results = json.loads(run.results)
        input_data = json.loads(run.input_data)
        
        # Valuation Summary
        valuation_summary = {
            "enterprise_value": results.get("enterprise_value", 0),
            "equity_value": results.get("equity_value", 0),
            "method_weights": input_data.get("method_weights", {})
        }
        
        # Credibility Score (Mock or derived)
        audit_issues = results.get("audit_issues", [])
        score = max(0, 100 - (len(audit_issues) * 5))
        credibility_score = {
            "score": score,
            "rating": "High" if score > 80 else "Medium" if score > 50 else "Low"
        }
        
        # Scenarios (Mock or derived from PWSA/Sensitivity)
        # Ideally we'd have explicit Base/Bull/Bear from a scenario run
        # For now, using +/- 20% of EV as placeholders if not found
        base_ev = results.get("enterprise_value", 0)
        scenarios = {
            "base": base_ev,
            "bull": base_ev * 1.2,
            "bear": base_ev * 0.8
        }
        
        # Forecast Snapshot
        # Extract from DCF input if available
        dcf_input = input_data.get("dcf_input", {})
        historical = dcf_input.get("historical", {})
        projections = dcf_input.get("projections", {})
        
        # Combine historical and simple projection for chart
        # This is a simplification; real logic would project year-by-year
        revenue = historical.get("revenue", [])
        ebitda = historical.get("ebitda", [])
        fcf = [] # Calculate or extract
        
        forecast = {
            "revenue": revenue,
            "ebitda": ebitda,
            "fcf": fcf
        }
        
        # Terminal Value Split
        # Extract from DCF results if available
        dcf_results = results.get("dcf_valuation", {})
        tv_split = {
            "terminal_value": dcf_results.get("terminal_value_present", 0),
            "explicit_period": dcf_results.get("explicit_period_present", 0)
        }
        
        # Method Breakdown
        method_breakdown = {
            "dcf": results.get("dcf_valuation", {}).get("enterprise_value", 0),
            "gpc": results.get("gpc_valuation", {}).get("enterprise_value", 0),
            "fcfe": results.get("fcfe_valuation", {}).get("equity_value", 0), # Note: Equity value
            "anav": results.get("anav_valuation", {}).get("net_asset_value", 0),
            "lbo": results.get("lbo_valuation", {}).get("implied_valuation", 0)
        }

        return OverviewViewResponse(
            company_name=run.company_name,
            valuation_summary=valuation_summary,
            credibility_score=credibility_score,
            scenarios=scenarios,
            forecast=forecast,
            terminal_value_split=tv_split,
            risks=[issue["message"] for issue in audit_issues if issue.get("severity") == "error"],
            method_breakdown=method_breakdown,
            input_summary=input_data
        )

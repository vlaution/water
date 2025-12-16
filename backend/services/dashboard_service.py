from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json
from backend.database.models import ValuationRun
from backend.api.dashboard_models import ExecutiveViewResponse, FinanceViewResponse, StrategyViewResponse, InvestorViewResponse, OverviewViewResponse
from backend.services.dashboard_models import (
    PortfolioViewResponse, PortfolioSummary, ValuationHeatmapItem,
    BenchmarkComparison, AcquisitionPotentialItem, ValuationTimelineItem,
    RiskMatrixItem, PortfolioAnnotation
)
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
            "lbo": results.get("lbo_valuation", {}).get("implied_valuation", 0),
            "vc": (results.get("vc_method") or {}).get("pre_money_valuation", (results.get("vc_method") or {}).get("post_money_valuation", 0)) # Fallback
        }
        
        # Fallback for Manual or simple runs: if all specific methods are 0 but top-level exists
        if all(v == 0 for v in method_breakdown.values()) and results.get("enterprise_value", 0) > 0:
            method_breakdown["manual/other"] = results.get("enterprise_value", 0)

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

    def get_portfolio_view(self) -> PortfolioViewResponse:
        
        # Aggregate calls to granular methods
        summary = self.get_portfolio_summary()
        heatmap = self.get_portfolio_heatmap(limit=100) # Default limit
        acquisition = self.get_acquisition_potential()
        timeline = self.get_portfolio_timeline()
        risks = self.get_risk_matrix()
        
        return PortfolioViewResponse(
            portfolio_summary=summary,
            valuation_heatmap=heatmap,
            benchmark_comparison=[
                 BenchmarkComparison(
                    sector="Technology",
                    avg_ev_ebitda=14.5,
                    portfolio_avg_ev_ebitda=12.5
                )
            ],
            acquisition_potential=acquisition,
            valuation_timeline=timeline,
            risk_matrix=risks
        )

    def get_portfolio_summary(self, comparison_days: Optional[int] = None) -> PortfolioSummary:
        from datetime import datetime, timedelta
        
        runs = self.db.query(ValuationRun).order_by(ValuationRun.created_at.desc()).all()
        
        # Helper to get snapshot stats at a specific time
        def get_snapshot_stats(cutoff_date=None):
            latest = {}
            for run in runs:
                if cutoff_date and run.created_at > cutoff_date:
                    continue
                if run.company_name not in latest:
                    latest[run.company_name] = run
            
            total_ev = 0.0
            multiples = []
            completeness_scores = []
            conf_scores = [] # Need conf scores for quality
            
            for run in latest.values():
                results = json.loads(run.results)
                input_data = json.loads(run.input_data)
                
                ev = results.get("enterprise_value", 0)
                total_ev += ev
                conf = results.get("confidence_score", {}).get("score", 0)
                multiples.append({"value": 12.5, "weight": conf}) # Placeholder multiple
                
                required_fields = ["dcf_input", "gpc_input"]
                fields_present = sum(1 for f in required_fields if input_data.get(f))
                completeness = (fields_present / len(required_fields)) * 100
                completeness_scores.append(completeness)
                conf_scores.append(conf)

            active_companies = len(latest)
            total_weight = sum(m["weight"] for m in multiples)
            weighted_avg = sum(m["value"] * m["weight"] for m in multiples) / total_weight if total_weight > 0 else 0
            
            total_qp = sum(c * (s/100) for c, s in zip(completeness_scores, conf_scores))
            qual_score = total_qp / active_companies if active_companies else 0
            
            return {
                "total_ev": total_ev,
                "weighted_avg": weighted_avg,
                "active_companies": active_companies,
                "quality_score": qual_score
            }

        current_stats = get_snapshot_stats()
        
        # Calculate comparison if requested
        ev_change = None
        mult_change = None
        active_change = None
        
        if comparison_days:
            cutoff = datetime.utcnow() - timedelta(days=comparison_days)
            hist_stats = get_snapshot_stats(cutoff)
            
            # Avoid division by zero
            if hist_stats["total_ev"] > 0:
                ev_change = ((current_stats["total_ev"] - hist_stats["total_ev"]) / hist_stats["total_ev"]) * 100
            
            if hist_stats["weighted_avg"] > 0:
                mult_change = ((current_stats["weighted_avg"] - hist_stats["weighted_avg"]) / hist_stats["weighted_avg"]) * 100
                
            active_change = current_stats["active_companies"] - hist_stats["active_companies"]

        return PortfolioSummary(
            total_ev=current_stats["total_ev"],
            avg_multiple=12.5, # Static placeholder kept
            weighted_avg_multiple=current_stats["weighted_avg"],
            active_companies=current_stats["active_companies"],
            data_quality_score=current_stats["quality_score"],
            last_updated=datetime.utcnow().strftime("%Y-%m-%d"),
            total_ev_change=ev_change,
            avg_multiple_change=mult_change,
            active_companies_change=active_change
        )

    def get_portfolio_heatmap(self, limit: int = 100, sector: str = None, region: str = None) -> List[ValuationHeatmapItem]:
        from datetime import datetime
        
        runs = self.db.query(ValuationRun).order_by(ValuationRun.created_at.desc()).all()
        latest_runs = {}
        for run in runs:
            # Filter logic (filtering BEFORE extracting details for performance would be better in SQL, 
            # but since sector/region are in JSON, we must filter in python or use complex SQL)
            # For MVP, fetching all then filtering is okay.
            if run.company_name not in latest_runs:
                latest_runs[run.company_name] = run
                
        items = []
        for run in list(latest_runs.values())[:limit]:
            results = json.loads(run.results)
            input_data = json.loads(run.input_data)
            
            # Extract Filterable Fields
            # Assuming these might be in a 'company_info' block or at root of input
            # If not present, default to Unknown
            run_sector = input_data.get("sector") or input_data.get("company_info", {}).get("sector", "Technology") 
            run_region = input_data.get("region") or input_data.get("company_info", {}).get("region", "North America")
            
            # Apply Filters
            if sector and sector != "All" and run_sector != sector:
                 continue
            if region and region != "All" and run_region != region:
                 continue

            ev = results.get("enterprise_value", 0)
            conf = results.get("confidence_score", {}).get("score", 0)
            
            # Quality & Warnings
            warnings = []
            last_updated = run.created_at
            if (datetime.utcnow() - last_updated).days > 30:
                warnings.append("Valuation outdated (>30 days)")
                
            required_fields = ["dcf_input", "gpc_input"]
            fields_present = sum(1 for f in required_fields if input_data.get(f))
            completeness = (fields_present / len(required_fields)) * 100
            
            items.append(ValuationHeatmapItem(
                run_id=run.id,
                company_name=run.company_name,
                enterprise_value=ev,
                confidence_score=conf,
                sector=run_sector,
                region=run_region,
                completeness_score=completeness,
                last_updated=last_updated.strftime("%Y-%m-%d"),
                validation_warnings=warnings
            ))
            
        return items

    def get_acquisition_potential(self) -> List[AcquisitionPotentialItem]:
        # Mock implementation for distinct service method
        runs = self.db.query(ValuationRun).order_by(ValuationRun.created_at.desc()).all()
        companies = set()
        items = []
        for run in runs:
            if run.company_name in companies: continue
            companies.add(run.company_name)
            items.append(AcquisitionPotentialItem(
                company_name=run.company_name,
                score=75.0, 
                reason="Strong fundamentals"
            ))
        return sorted(items, key=lambda x: x.score, reverse=True)

    def get_portfolio_timeline(self) -> List[ValuationTimelineItem]:
        from datetime import datetime
        
        runs = self.db.query(ValuationRun).all()
        timeline_data = {}
        for run in runs: # Simplified aggregation
             date_str = run.created_at.strftime("%Y-%m")
             res = json.loads(run.results)
             timeline_data[date_str] = timeline_data.get(date_str, 0) + res.get("enterprise_value", 0)
             
        # Mock Annotations (Dynamic to match current data)
        current_month = datetime.utcnow().strftime("%Y-%m")
        annotations = {
            current_month: PortfolioAnnotation(id="1", date=current_month, label="Current Review", type="milestone"),
            "2024-06": PortfolioAnnotation(id="2", date="2024-06", label="Fund Raise", type="event")
        }
             
        return [
            ValuationTimelineItem(
                date=d, 
                total_ev=v,
                annotation=annotations.get(d)
            ) 
            for d, v in sorted(timeline_data.items())
        ]

    def get_risk_matrix(self) -> List[RiskMatrixItem]:
        runs = self.db.query(ValuationRun).order_by(ValuationRun.created_at.desc()).all()
        latest = {}
        for r in runs:
            if r.company_name not in latest: latest[r.company_name] = r
            
        items = []
        for run in latest.values():
            res = json.loads(run.results)
            issues = res.get("audit_issues", [])
            risk_level = "High" if len(issues) > 5 else "Medium" if len(issues) > 2 else "Low"
            items.append(RiskMatrixItem(
                company_name=run.company_name,
                risk_level=risk_level,
                flags=[i["message"] for i in issues[:3]]
            ))
        return items


from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import List, Dict, Any, Optional
import json
from datetime import datetime, timedelta
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

    def _get_latest_runs_subquery(self):
        """
        Returns a query for the latest ValuationRun per company.
        Optimized to avoid fetching all history.
        """
        # Subquery to rank runs by date per company
        subq = self.db.query(
            ValuationRun.id,
            func.row_number().over(
                partition_by=ValuationRun.company_name,
                order_by=desc(ValuationRun.created_at)
            ).label("rn")
        ).subquery()
        
        # Select runs where rank is 1
        return self.db.query(ValuationRun).join(subq, ValuationRun.id == subq.c.id).filter(subq.c.rn == 1)

    def get_executive_view(self, user_id: str = None) -> ExecutiveViewResponse:
        # Optimization: Fetch only latest runs per company
        latest_runs = self._get_latest_runs_subquery().all()
        
        total_value = 0.0
        companies = set()
        confidence_scores = []
        recent_activity = []
        
        # Also fetch strictly recent 5 runs for activity feed (regardless of company uniqueness)
        recent_raw = self.db.query(ValuationRun).order_by(desc(ValuationRun.created_at)).limit(5).all()
        for run in recent_raw:
            try:
                res = json.loads(run.results)
                recent_activity.append({
                    "company": run.company_name,
                    "date": run.created_at.strftime("%Y-%m-%d"),
                    "value": res.get("enterprise_value", 0),
                    "status": "Completed",
                    "id": run.id
                })
            except:
                continue

        tops = []
        
        for run in latest_runs:
            companies.add(run.company_name)
            try:
                results = json.loads(run.results)
                val = results.get("enterprise_value", 0)
                total_value += val
                
                if "confidence_score" in results:
                    confidence_scores.append(results["confidence_score"].get("score", 0))
                
                # Collect for top ops
                tops.append({
                    "name": run.company_name,
                    "value": val,
                    "industry": "Tech" # Placeholder
                })
            except:
                continue
                
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        
        # Sort tops
        tops.sort(key=lambda x: x["value"], reverse=True)
        top_opportunities = tops[:3]

        # Latest global metrics
        latest_run_metrics = {"ev": 0.0, "alerts": []}
        if recent_raw:
            try:
                lr_res = json.loads(recent_raw[0].results)
                latest_run_metrics["ev"] = lr_res.get("enterprise_value", 0)
                latest_run_metrics["alerts"] = lr_res.get("strategic_alerts", [])
            except:
                pass

        return ExecutiveViewResponse(
            total_portfolio_value=total_value,
            active_companies=len(companies),
            average_confidence=avg_confidence,
            enterprise_value=latest_run_metrics["ev"],
            strategic_alerts=latest_run_metrics["alerts"][:3],
            top_opportunities=top_opportunities,
            recent_activity=recent_activity
        )

    def get_finance_view(self, run_id: str) -> FinanceViewResponse:
        run = self.db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
        if not run:
            raise ValueError("Run not found")
            
        results = json.loads(run.results)
        input_data = json.loads(run.input_data)
        
        benchmarks = self.benchmarking_service.get_benchmarks(run.company_name)
        
        return FinanceViewResponse(
            company_name=run.company_name,
            enterprise_value=results.get("enterprise_value", 0),
            equity_value=results.get("equity_value", 0),
            wacc=input_data.get("dcf_input", {}).get("projections", {}).get("discount_rate", 0),
            multiples={"EV/Revenue": 5.0, "EV/EBITDA": 12.0},
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
        
        audit_issues = results.get("audit_issues", [])
        score = 100 - (len(audit_issues) * 5)
        
        return InvestorViewResponse(
            company_name=run.company_name,
            deal_readiness_score=max(0, score),
            key_risks=[issue["message"] for issue in audit_issues[:3]],
            upside_potential=results.get("upside_potential", 0),
            exit_scenarios=[]
        )

    def get_overview_view(self, run_id: str) -> OverviewViewResponse:
        run = self.db.query(ValuationRun).filter(ValuationRun.id == run_id).first()
        if not run:
            raise ValueError("Run not found")
            
        results = json.loads(run.results)
        input_data = json.loads(run.input_data)
        
        valuation_summary = {
            "enterprise_value": results.get("enterprise_value", 0),
            "equity_value": results.get("equity_value", 0),
            "method_weights": input_data.get("method_weights", {})
        }
        
        audit_issues = results.get("audit_issues", [])
        score = max(0, 100 - (len(audit_issues) * 5))
        credibility_score = {
            "score": score,
            "rating": "High" if score > 80 else "Medium" if score > 50 else "Low"
        }
        
        base_ev = results.get("enterprise_value", 0)
        scenarios = {
            "base": base_ev,
            "bull": base_ev * 1.2,
            "bear": base_ev * 0.8
        }
        
        dcf_input = input_data.get("dcf_input", {})
        historical = dcf_input.get("historical", {})
        
        forecast = {
            "revenue": historical.get("revenue", []),
            "ebitda": historical.get("ebitda", []),
            "fcf": []
        }
        
        dcf_results = results.get("dcf_valuation", {})
        tv_split = {
            "terminal_value": dcf_results.get("terminal_value_present", 0),
            "explicit_period": dcf_results.get("explicit_period_present", 0)
        }
        
        method_breakdown = {
            "dcf": results.get("dcf_valuation", {}).get("enterprise_value", 0),
            "gpc": results.get("gpc_valuation", {}).get("enterprise_value", 0),
            "fcfe": results.get("fcfe_valuation", {}).get("equity_value", 0),
            "anav": results.get("anav_valuation", {}).get("net_asset_value", 0),
            "lbo": results.get("lbo_valuation", {}).get("implied_valuation", 0),
            "vc": (results.get("vc_method") or {}).get("pre_money_valuation", 0)
        }
        
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
        summary = self.get_portfolio_summary()
        heatmap = self.get_portfolio_heatmap(limit=100)
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
        # Optimized to use latest runs only
        latest_runs = self._get_latest_runs_subquery().all()
        
        def calculate_stats(runs_list):
            total_ev = 0.0
            multiples = []
            completeness_scores = []
            conf_scores = []
            active_companies = len(runs_list)
            
            for run in runs_list:
                try:
                    results = json.loads(run.results)
                    input_data = json.loads(run.input_data)
                    
                    ev = results.get("enterprise_value", 0)
                    total_ev += ev
                    conf = results.get("confidence_score", {}).get("score", 0)
                    multiples.append({"value": 12.5, "weight": conf}) # Placeholder
                    
                    required_fields = ["dcf_input", "gpc_input"]
                    fields_present = sum(1 for f in required_fields if input_data.get(f))
                    completeness = (fields_present / len(required_fields)) * 100
                    completeness_scores.append(completeness)
                    conf_scores.append(conf)
                except:
                    continue

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

        current_stats = calculate_stats(latest_runs)
        
        ev_change = None
        mult_change = None
        active_change = None
        
        if comparison_days:
            cutoff = datetime.utcnow() - timedelta(days=comparison_days)
            # For history, we can't easily use the same 'latest' query. 
            # We would need latest AS OF that date. 
            # Simplified: filter the current latest runs (assuming no new companies added, just value change? No, that's wrong).
            # Correct approach: Subquery with filter on created_at < cutoff
            
            subq_hist = self.db.query(
                ValuationRun.id,
                func.row_number().over(
                    partition_by=ValuationRun.company_name,
                    order_by=desc(ValuationRun.created_at)
                ).label("rn")
            ).filter(ValuationRun.created_at <= cutoff).subquery()
            
            hist_runs = self.db.query(ValuationRun).join(subq_hist, ValuationRun.id == subq_hist.c.id).filter(subq_hist.c.rn == 1).all()
            hist_stats = calculate_stats(hist_runs)
            
            if hist_stats["total_ev"] > 0:
                ev_change = ((current_stats["total_ev"] - hist_stats["total_ev"]) / hist_stats["total_ev"]) * 100
            
            if hist_stats["weighted_avg"] > 0:
                mult_change = ((current_stats["weighted_avg"] - hist_stats["weighted_avg"]) / hist_stats["weighted_avg"]) * 100
                
            active_change = current_stats["active_companies"] - hist_stats["active_companies"]

        return PortfolioSummary(
            total_ev=current_stats["total_ev"],
            avg_multiple=12.5,
            weighted_avg_multiple=current_stats["weighted_avg"],
            active_companies=current_stats["active_companies"],
            data_quality_score=current_stats["quality_score"],
            last_updated=datetime.utcnow().strftime("%Y-%m-%d"),
            total_ev_change=ev_change,
            avg_multiple_change=mult_change,
            active_companies_change=active_change
        )

    def get_portfolio_heatmap(self, limit: int = 100, sector: str = None, region: str = None) -> List[ValuationHeatmapItem]:
        # Use optimized query
        latest_runs = self._get_latest_runs_subquery().all()
        
        # Apply filtering in Python (since sector/region are in JSON)
        # This is strictly better than before because N is unique companies, not all runs.
        
        items = []
        for run in latest_runs:
            if len(items) >= limit: break
            
            try:
                results = json.loads(run.results)
                input_data = json.loads(run.input_data)
                
                run_sector = input_data.get("sector") or input_data.get("company_info", {}).get("sector", "Technology") 
                run_region = input_data.get("region") or input_data.get("company_info", {}).get("region", "North America")
                
                if sector and sector != "All" and run_sector != sector: continue
                if region and region != "All" and run_region != region: continue

                ev = results.get("enterprise_value", 0)
                conf = results.get("confidence_score", {}).get("score", 0)
                
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
            except:
                continue
            
        return items

    def get_acquisition_potential(self) -> List[AcquisitionPotentialItem]:
        # Optimization: Use latest runs
        latest_runs = self._get_latest_runs_subquery().all()
        items = []
        for run in latest_runs:
            items.append(AcquisitionPotentialItem(
                company_name=run.company_name,
                score=75.0, # Placeholder
                reason="Strong fundamentals"
            ))
        return sorted(items, key=lambda x: x.score, reverse=True)

    def get_portfolio_timeline(self) -> List[ValuationTimelineItem]:
        # Timeline needs ALL history, but aggregated by Month.
        # This is a good case for SQL aggregation if we had value in a column.
        # Since value is in JSON, we must fetch history.
        # Limiting to last 12-24 months might be a good safety implementation.
        runs = self.db.query(ValuationRun).order_by(ValuationRun.created_at).all()
        
        timeline_data = {}
        for run in runs:
             date_str = run.created_at.strftime("%Y-%m")
             try:
                 res = json.loads(run.results)
                 timeline_data[date_str] = timeline_data.get(date_str, 0) + res.get("enterprise_value", 0)
             except: continue
             
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
        latest_runs = self._get_latest_runs_subquery().all()
        items = []
        for run in latest_runs:
            try:
                res = json.loads(run.results)
                issues = res.get("audit_issues", [])
                risk_level = "High" if len(issues) > 5 else "Medium" if len(issues) > 2 else "Low"
                items.append(RiskMatrixItem(
                    company_name=run.company_name,
                    risk_level=risk_level,
                    flags=[i["message"] for i in issues[:3]]
                ))
            except: continue
        return items


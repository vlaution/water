import numpy as np
import os
import json
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel
from backend.calculations.models import ValuationInput
from alpha_vantage.fundamentaldata import FundamentalData
from groq import Groq
from backend.database.models import SessionLocal, IndustryNorm, ValidationPattern

class AnomalyResult(BaseModel):
    field: str
    value: float
    is_outlier: bool
    severity: str  # "warning", "critical", "normal"
    message: Optional[str] = None
    z_score: Optional[float] = None
    benchmark_source: str = "Hardcoded" # "Hardcoded", "AlphaVantage", "IndustryAvg", "Database"
    suggested_min: Optional[float] = None
    suggested_max: Optional[float] = None
    context: Optional[str] = None

class PatternMatch(BaseModel):
    matched_cluster: str
    confidence: float
    typical_assumptions: Dict[str, str]
    avg_values: Dict[str, float]

class ValidationAnalysisResponse(BaseModel):
    anomalies: List[AnomalyResult]
    patterns: Optional[PatternMatch] = None
    suggestions: List[str] = []
    confidence_score: float  # 0.0 to 1.0
    summary: str

class AnomalyDetectionService:
    def __init__(self):
        self.alpha_vantage_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        self.groq_key = os.getenv("GROQ_API_KEY")
        
        # Default benchmarks (fallback)
        self.benchmarks = {
            "revenue_growth": (0.05, 0.10),  # Mean 5%, StdDev 10%
            "ebitda_margin": (0.20, 0.15),   # Mean 20%, StdDev 15%
            "terminal_growth_rate": (0.025, 0.01), # Mean 2.5%, StdDev 1%
            "wacc": (0.08, 0.03),            # Mean 8%, StdDev 3%
        }

    def _get_db_benchmarks(self, sector: str) -> Dict[str, Tuple[float, float]]:
        """Fetch benchmarks from the database for a given sector."""
        db = SessionLocal()
        try:
            norms = db.query(IndustryNorm).filter(IndustryNorm.sector == sector).all()
            if not norms:
                return {}
            
            benchmarks = {}
            for norm in norms:
                benchmarks[norm.metric] = (norm.mean, norm.std_dev)
            return benchmarks
        except Exception as e:
            print(f"Database Error: {e}")
            return {}
        finally:
            db.close()

    def _get_alpha_vantage_benchmarks(self, ticker: str) -> Dict[str, tuple]:
        """
        Fetches company overview to get industry benchmarks (simplified).
        """
        if not self.alpha_vantage_key or not ticker:
            return {}

        try:
            fd = FundamentalData(key=self.alpha_vantage_key, output_format='json')
            overview, _ = fd.get_company_overview(symbol=ticker)
            # In a real app, we would parse 'Industry' from overview and map it to our DB sectors
            return {} 
        except Exception as e:
            print(f"Alpha Vantage Error: {e}")
            return {}

    def _find_matching_pattern(self, sector: str, growth: float, margin: float) -> Optional[PatternMatch]:
        """Finds the closest cluster pattern for the given input."""
        db = SessionLocal()
        try:
            patterns = db.query(ValidationPattern).all() # Filter by sector in memory for flexibility or query
            # Filter for sector-specific patterns
            sector_patterns = []
            for p in patterns:
                cond = json.loads(p.condition_json)
                if cond.get("sector") == sector:
                    sector_patterns.append((p, cond))
            
            if not sector_patterns:
                return None

            # Find closest centroid
            best_match = None
            min_dist = float('inf')

            for pattern, cond in sector_patterns:
                avg_growth = cond.get("avg_growth", 0)
                avg_margin = cond.get("avg_margin", 0)
                
                # Euclidean distance (simple)
                dist = np.sqrt((growth - avg_growth)**2 + (margin - avg_margin)**2)
                
                if dist < min_dist:
                    min_dist = dist
                    best_match = (pattern, cond)

            if best_match:
                pattern, cond = best_match
                # Confidence based on distance (closer = higher confidence)
                confidence = max(0.0, 1.0 - min_dist) 
                
                return PatternMatch(
                    matched_cluster=pattern.message_template.split('(')[1].split(')')[0], # Extract name
                    confidence=confidence,
                    typical_assumptions={
                        "revenue_growth": f"{cond['growth_range'][0]:.1%} - {cond['growth_range'][1]:.1%}",
                        "ebitda_margin": f"{cond['margin_range'][0]:.1%} - {cond['margin_range'][1]:.1%}"
                    },
                    avg_values={
                        "revenue_growth": cond.get("avg_growth", 0),
                        "ebitda_margin": cond.get("avg_margin", 0)
                    }
                )
            return None

        except Exception as e:
            print(f"Pattern Match Error: {e}")
            return None
        finally:
            db.close()

    def _get_ai_summary(self, anomalies: List[AnomalyResult], company_name: str, pattern: Optional[PatternMatch]) -> str:
        if not self.groq_key:
            return self._generate_static_summary(anomalies)

        try:
            client = Groq(api_key=self.groq_key)
            
            anomalies_text = "\n".join([
                f"- {a.field}: {a.value:.1%} (Severity: {a.severity}, Message: {a.message})" 
                for a in anomalies
            ])
            
            pattern_text = ""
            if pattern:
                pattern_text = f"\nMatched Pattern: {pattern.matched_cluster} (Confidence: {pattern.confidence:.0%})\nTypical Growth: {pattern.typical_assumptions['revenue_growth']}, Margin: {pattern.typical_assumptions['ebitda_margin']}"

            prompt = f"""
            You are a senior valuation expert. Analyze the following anomalies detected in the valuation assumptions for {company_name}.
            
            Anomalies Detected:
            {anomalies_text if anomalies else "None. All assumptions look standard."}
            {pattern_text}
            
            Provide a concise, professional summary (max 3 sentences) advising the user on what to review. 
            If there are no anomalies, confirm the assumptions look solid.
            """
            
            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model="llama3-8b-8192",
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            print(f"Groq Error: {e}")
            return self._generate_static_summary(anomalies)

    def _generate_static_summary(self, anomalies: List[AnomalyResult]) -> str:
        score = 1.0
        for anomaly in anomalies:
            if anomaly.severity == "critical":
                score -= 0.2
            elif anomaly.severity == "warning":
                score -= 0.1
        score = max(0.0, score)

        if score < 0.6:
            return "Significant deviations from industry norms detected. Please review critical warnings."
        elif score < 0.9:
            return "Some assumptions are outside typical ranges."
        return "Assumptions look solid."

    def detect_outliers(self, value: float, metric: str, custom_benchmarks: Dict = None) -> AnomalyResult:
        benchmarks = custom_benchmarks if custom_benchmarks else self.benchmarks
        
        if metric not in benchmarks:
            return AnomalyResult(field=metric, value=value, is_outlier=False, severity="normal")

        mean, std_dev = benchmarks[metric]
        z_score = (value - mean) / std_dev if std_dev > 0 else 0
        
        is_outlier = abs(z_score) > 2.0
        severity = "normal"
        message = None
        
        # Calculate suggested range (Mean +/- 1 StdDev)
        suggested_min = mean - std_dev
        suggested_max = mean + std_dev

        if abs(z_score) > 3.0:
            severity = "critical"
            message = f"Value {value:.1%} is extremely far from norm (Z: {z_score:.1f})"
        elif abs(z_score) > 2.0:
            severity = "warning"
            message = f"Value {value:.1%} is unusual (Z: {z_score:.1f})"

        context = f"Industry Mean: {mean:.1%}, Range: {suggested_min:.1%} - {suggested_max:.1%}"

        return AnomalyResult(
            field=metric,
            value=value,
            is_outlier=is_outlier,
            severity=severity,
            message=message,
            z_score=z_score,
            benchmark_source="Database" if custom_benchmarks else "Hardcoded",
            suggested_min=suggested_min,
            suggested_max=suggested_max,
            context=context
        )

    def validate_assumptions(self, assumptions: ValuationInput, ticker: Optional[str] = None) -> ValidationAnalysisResponse:
        anomalies = []
        
        # 1. Determine Benchmarks
        # Priority: DB (by sector) > Hardcoded
        # We try to guess sector from input or ticker (mocked for now)
        sector = assumptions.industry if hasattr(assumptions, 'industry') and assumptions.industry else "SaaS" # Default to SaaS for demo
        
        db_benchmarks = self._get_db_benchmarks(sector)
        active_benchmarks = self.benchmarks.copy()
        if db_benchmarks:
            active_benchmarks.update(db_benchmarks)

        # 2. Extract Metrics
        metrics_to_check = {}
        if assumptions.dcf_input:
            proj = assumptions.dcf_input.projections
            metrics_to_check["revenue_growth"] = proj.revenue_growth_start
            metrics_to_check["ebitda_margin"] = proj.ebitda_margin_start
            metrics_to_check["terminal_growth_rate"] = proj.terminal_growth_rate
            metrics_to_check["wacc"] = proj.discount_rate

        # 3. Detect Outliers
        for metric, value in metrics_to_check.items():
            result = self.detect_outliers(value, metric, active_benchmarks)
            if result.is_outlier:
                anomalies.append(result)

        # 4. Pattern Recognition (Clustering)
        rev_growth = metrics_to_check.get("revenue_growth", 0)
        ebitda_margin = metrics_to_check.get("ebitda_margin", 0)
        
        pattern_match = self._find_matching_pattern(sector, rev_growth, ebitda_margin)
        suggestions = []
        
        if pattern_match:
            suggestions.append(f"Matched Archetype: {pattern_match.matched_cluster}")
            suggestions.append(f"Typical Growth: {pattern_match.typical_assumptions['revenue_growth']}")
            suggestions.append(f"Typical Margin: {pattern_match.typical_assumptions['ebitda_margin']}")

        # 5. Calculate Score
        score = 1.0
        for anomaly in anomalies:
            if anomaly.severity == "critical":
                score -= 0.2
            elif anomaly.severity == "warning":
                score -= 0.1
        score = max(0.0, score)

        # 6. Generate Summary (AI or Static)
        summary = self._get_ai_summary(anomalies, assumptions.company_name, pattern_match)

        return ValidationAnalysisResponse(
            anomalies=anomalies,
            patterns=pattern_match,
            suggestions=suggestions,
            confidence_score=score,
            summary=summary
        )

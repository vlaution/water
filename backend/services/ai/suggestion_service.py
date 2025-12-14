from typing import Dict, Any, List, Optional
import json
from backend.services.ai.pattern_service import PatternRecognitionService
from backend.services.finance.impact_engine import ImpactEstimationEngine
from backend.database.models import SessionLocal, ValidationPattern

import hashlib
import time

class SuggestionService:
    def __init__(self):
        self.pattern_service = PatternRecognitionService()
        self.impact_engine = ImpactEstimationEngine()
        self._cache = {}
        self._cache_ttl = 3600 # 1 hour

    def generate_suggestions(self, company_data: Dict[str, Any], current_assumptions: Dict[str, float], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates smart suggestions based on patterns, context, and impact.
        """
        # 1. Check Cache
        cache_key = self._generate_cache_key(company_data, current_assumptions, context)
        if cache_key in self._cache:
            timestamp, data = self._cache[cache_key]
            if time.time() - timestamp < self._cache_ttl:
                print(f"Cache Hit for {cache_key}")
                return data
        
        # 2. Find Matching Pattern
        # We need a way to find the closest cluster. 
        # Since PatternRecognitionService doesn't expose a direct "find_closest" that returns the cluster object easily without re-running logic,
        # we might need to duplicate some logic or enhance PatternService.
        # For now, let's assume we can query the DB for the best match based on sector/growth/margin.
        
        matched_pattern = self._find_best_pattern(company_data, current_assumptions)
        
        suggestions = {}
        confidence_scores = {}
        reasoning = {}
        
        if matched_pattern:
            # 3. Generate Suggestions based on Archetype
            suggestions = self._derive_suggestions(matched_pattern, current_assumptions, context)
            
            # 4. Calculate Confidence
            confidence_scores = self._calculate_confidence(matched_pattern, context)
            
            # 5. Generate Reasoning
            reasoning = self._generate_reasoning(matched_pattern, suggestions, current_assumptions, context)
        
        # 6. Estimate Impact
        impact = self.impact_engine.calculate_impact(current_assumptions, suggestions if suggestions else current_assumptions)

        result = {
            "suggestions": {
                "adjusted_assumptions": suggestions,
                "confidence_scores": confidence_scores,
                "reasoning": reasoning,
                "expected_impact": impact,
                "archetype_match": {
                    "name": matched_pattern.message_template.split('(')[1].split(')')[0] if matched_pattern else "Unknown",
                    "confidence": confidence_scores.get("overall", 0.0),
                    # "similar_companies_count": matched_pattern.condition_json.get("sample_size", 0) # Need to parse JSON
                } if matched_pattern else None
            },
            "context": {
                "market_conditions": "Q1 2025: SaaS multiples contracting, focus on profitability", # Placeholder for real market data
                "risks": ["High burn rate"] if current_assumptions.get('ebitda_margin', 0) < -0.2 else []
            }
        }
        
        # 7. Update Cache
        self._cache[cache_key] = (time.time(), result)
        return result

    def _generate_cache_key(self, company_data, current_assumptions, context):
        """Generates a unique hash for the request."""
        raw = json.dumps({
            "company": company_data,
            "assumptions": current_assumptions,
            "context": context
        }, sort_keys=True)
        return hashlib.md5(raw.encode()).hexdigest()

    def _find_best_pattern(self, company_data: Dict[str, Any], current_assumptions: Dict[str, float]) -> Optional[ValidationPattern]:
        """
        Finds the best matching pattern from the database.
        """
        db = SessionLocal()
        try:
            sector = company_data.get("sector", "SaaS") # Default to SaaS
            patterns = db.query(ValidationPattern).filter(ValidationPattern.condition_json.contains(sector)).all()
            
            best_match = None
            min_dist = float('inf')
            
            # Simple Euclidean distance on Growth/Margin
            growth = current_assumptions.get("revenue_growth", 0)
            margin = current_assumptions.get("ebitda_margin", 0)
            
            for p in patterns:
                try:
                    cond = json.loads(p.condition_json)
                    if cond.get("sector") != sector: continue
                    
                    avg_growth = cond.get("avg_growth", 0)
                    avg_margin = cond.get("avg_margin", 0)
                    
                    dist = ((growth - avg_growth)**2 + (margin - avg_margin)**2)**0.5
                    
                    if dist < min_dist:
                        min_dist = dist
                        best_match = p
                except:
                    continue
            
            return best_match
        finally:
            db.close()

    def _derive_suggestions(self, pattern: ValidationPattern, current: Dict[str, float], context: Dict[str, Any]) -> Dict[str, float]:
        """
        Derives suggested values based on pattern averages and user context (Risk Profile).
        """
        cond = json.loads(pattern.condition_json)
        avg_growth = cond.get("avg_growth", 0.10)
        avg_margin = cond.get("avg_margin", 0.10)
        
        # Base suggestion is the archetype average
        suggested_growth = avg_growth
        suggested_margin = avg_margin
        
        # Adjust based on Risk Tolerance
        risk_tolerance = context.get("risk_tolerance", "moderate")
        
        if risk_tolerance == "aggressive":
            # Aggressive: 75th percentile (simulated by adding 10% relative)
            suggested_growth *= 1.10
            suggested_margin *= 1.05 # Margins usually harder to stretch aggressively
        elif risk_tolerance == "conservative":
            # Conservative: 25th percentile (simulated by reducing 10% relative)
            suggested_growth *= 0.90
            suggested_margin *= 0.95
            
        return {
            "revenue_growth": round(suggested_growth, 4),
            "ebitda_margin": round(suggested_margin, 4),
            "wacc": current.get("wacc", 0.12), # Pass through for now
            "terminal_growth": current.get("terminal_growth", 0.03) # Pass through
        }

    def _calculate_confidence(self, pattern: ValidationPattern, context: Dict[str, Any]) -> Dict[str, float]:
        """
        Calculates confidence scores based on pattern match, sample size, and historical accuracy.
        """
        # 1. Base Confidence from Pattern Match (Distance-based, simplified here)
        base_confidence = 0.85 
        
        # 2. Adjust for Sample Size
        try:
            cond = json.loads(pattern.condition_json)
            sample_size = cond.get("sample_size", 0)
            if sample_size < 10: base_confidence -= 0.1
            elif sample_size > 50: base_confidence += 0.05
        except:
            pass

        # 3. Adjust for Historical Accuracy
        accuracy_score = self._get_historical_accuracy(pattern.id)
        final_confidence = min(0.99, base_confidence + (accuracy_score * 0.1))

        return {
            "overall": round(final_confidence, 2),
            "revenue_growth": round(final_confidence, 2), # Can be more granular later
            "ebitda_margin": round(final_confidence * 0.95, 2) # Margins are harder to predict
        }

    def _get_historical_accuracy(self, pattern_id: int) -> float:
        """
        Queries UserFeedback to see how often this pattern's suggestions were accepted.
        Returns a score between -0.1 (poor) and +0.1 (good).
        """
        db = SessionLocal()
        try:
            # This is a simplified query. In reality, we'd link feedback to specific patterns.
            # For now, we'll check general pattern acceptance.
            total = db.query(UserFeedback).filter(UserFeedback.anomaly_field == "pattern_match").count()
            if total == 0: return 0.0
            
            accepted = db.query(UserFeedback).filter(UserFeedback.anomaly_field == "pattern_match", UserFeedback.user_action == "accept").count()
            rate = accepted / total
            
            # Normalize: 50% acceptance is neutral. >50% adds confidence.
            return (rate - 0.5) * 0.2 # Scale to +/- 0.1 range
        except:
            return 0.0
        finally:
            db.close()

    def _generate_reasoning(self, pattern: ValidationPattern, suggestions: Dict[str, float], current: Dict[str, float], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates human-readable reasoning. Uses Groq LLM if available for dynamic insights.
        """
        archetype_name = pattern.message_template.split('(')[1].split(')')[0]
        
        import os
        import requests
        api_key = os.getenv("GROQ_API_KEY")
        
        if api_key:
            try:
                # Prepare prompt for reasoning
                prompt = (
                    f"Explain why a company in the {json.loads(pattern.condition_json).get('sector', 'Tech')} sector "
                    f"should adjust their assumptions to match the '{archetype_name}' archetype.\n"
                    f"Context: Risk Tolerance: {context.get('risk_tolerance')}, Use Case: {context.get('use_case')}.\n"
                    f"Current Growth: {current.get('revenue_growth'):.1%}, Suggested: {suggestions['revenue_growth']:.1%}.\n"
                    f"Current Margin: {current.get('ebitda_margin'):.1%}, Suggested: {suggestions['ebitda_margin']:.1%}.\n"
                    f"Provide 2 concise sentences: one for growth, one for margin. Return valid JSON: {{'revenue_growth': '...', 'ebitda_margin': '...'}}"
                )
                
                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama3-70b-8192",
                        "messages": [
                            {"role": "system", "content": "You are a valuation expert. Output JSON only."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.5,
                        "response_format": {"type": "json_object"}
                    },
                    timeout=5
                )
                
                if response.status_code == 200:
                    content = response.json()["choices"][0]["message"]["content"]
                    return {
                        "summary": f"Based on analysis of {archetype_name} peers.",
                        "per_assumption": json.loads(content)
                    }
            except Exception as e:
                print(f"Groq Reasoning Failed: {e}")

        # Fallback to static template
        return {
            "summary": f"Based on {json.loads(pattern.condition_json).get('sample_size', 'similar')} {archetype_name} companies.",
            "per_assumption": {
                "revenue_growth": f"Adjusted to {suggestions['revenue_growth']:.1%} to align with {archetype_name} norms.",
                "ebitda_margin": f"Targeting {suggestions['ebitda_margin']:.1%} based on sector efficiency benchmarks."
            }
        }

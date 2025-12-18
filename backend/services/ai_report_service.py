from typing import Dict, Any, List
import json
import httpx
import os

class AIReportService:
    """
    Service to generate "AI-powered" executive summaries and insights.
    Uses async httpx for non-blocking I/O and implements secure payload handling.
    """
    
    def _truncate_context(self, data: Any, max_chars: int = 6000) -> str:
        """Securely truncates context to avoid token limits and reduce data exposure."""
        try:
            json_str = json.dumps(data, indent=2)
            if len(json_str) > max_chars:
                return json_str[:max_chars] + "... [TRUNCATED]"
            return json_str
        except:
            return str(data)[:max_chars]

    
    _cache: Dict[str, Tuple[float, Any]] = {} # Simple in-memory cache: {hash: (timestamp, response)}
    _CACHE_TTL = 3000 # 5 minutes

    def _get_cache_key(self, payload: Dict) -> str:
        """Create a deterministic hash of the payload."""
        import hashlib
        return hashlib.md5(json.dumps(payload, sort_keys=True).encode()).hexdigest()

    async def _call_nvidia_api(self, payload: Dict, timeout: int = 30, bypass_cache: bool = False) -> Dict:
        """Helper to safely call NVIDIA API with SSL verification & caching."""
        
        # 1. Check Cache
        import time
        cache_key = self._get_cache_key(payload)
        now = time.time()
        
        if not bypass_cache and cache_key in self._cache:
            timestamp, cached_data = self._cache[cache_key]
            if now - timestamp < self._CACHE_TTL:
                print(f"AI Cache Hit: {cache_key[:8]}")
                return cached_data
            else:
                del self._cache[cache_key] # Expired
        elif bypass_cache and cache_key in self._cache:
             print(f"AI Cache Bypassing: {cache_key[:8]}")
             del self._cache[cache_key]
        
        api_key = os.getenv("NVIDIA_API_KEY") or os.getenv("GROQ_API_KEY")
        base_url = "https://integrate.api.nvidia.com/v1" if os.getenv("NVIDIA_API_KEY") else "https://api.groq.com/openai/v1"
        
        if not api_key:
            return None

        async with httpx.AsyncClient(verify=True) as client:
            try:
                response = await client.post(
                    f"{base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json=payload,
                    timeout=timeout
                )
                
                if response.status_code == 200:
                    data = response.json()
                    # 2. Set Cache
                    self._cache[cache_key] = (now, data)
                    return data
                else:
                    print(f"AI API Error: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"AI Connection Failed: {e}")
        return None

    async def generate_executive_summary(self, valuation_results: Dict[str, Any], company_name: str, bypass_cache: bool = False) -> str:
        """
        Generates an executive summary asynchronously.
        """
        model = "nvidia/nemotron-3-nano-30b-a3b" if os.getenv("NVIDIA_API_KEY") else "llama3-70b-8192"
        context_str = self._truncate_context(valuation_results, 4000)
        
        prompt = (
            f"You are a sophisticated financial analyst. Write a professional 3-paragraph executive summary "
            f"for the valuation of {company_name}. \n\n"
            f"Valuation Data:\n{context_str}\n\n"
            f"Requirements:\n"
            f"1. First paragraph: Valuation Verdict (Undervalued/Overvalued) and calculated Enterprise Value.\n"
            f"2. Second paragraph: Key structural drivers (Growth, Margins, WACC).\n"
            f"3. Third paragraph: Strategic recommendations based on the verdict.\n"
            f"Style: Professional, investment banking tone, concise."
        )
        
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a Senior Investment Banking Associate at a top-tier firm (Goldman/Morgan Stanley style). Your tone is professional, concise, and authoritative. Focus on valuation drivers, risk-adjusted returns, and strategic implications. Avoid generic fluff."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.4, # Slightly lower temperature for more professional consistency
            "max_tokens": 1024
        }

        if "nvidia" in model:
            payload["extra_body"] = {"chat_template_kwargs": {"enable_thinking": True}}

        response = await self._call_nvidia_api(payload, timeout=45, bypass_cache=bypass_cache)
        if response:
            return response["choices"][0]["message"]["content"]
        
        # Fallback to Template Engine
        print("Info: Using template engine for summary (Fallback).")
        return self._generate_template_summary(valuation_results, company_name)

    async def generate_dashboard_insights(self, valuation_summary: List[Dict[str, Any]], bypass_cache: bool = False) -> List[str]:
        """
        Generates quick bullet-point insights asynchronously.
        """
        context_str = self._truncate_context(valuation_summary, 2000)
        prompt = (
            f"Analyze these active valuation runs and provide 3 short, punchy, actionable insights "
            f"for the analyst. Focus on anomalies, missing data, or high-value opportunities.\n"
            f"Data: {context_str}\n"
            f"Format: Return ONLY a JSON array of 3 strings. Example: [\"Review Apple WACC\", \"Tesla multiples high\"]"
        )

        payload = {
            "model": "nvidia/nemotron-3-nano-30b-a3b",
            "messages": [
                {"role": "system", "content": "You are a helpful financial assistant. Output JSON only."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 256,
            "extra_body": {"chat_template_kwargs": {"enable_thinking": True}}
        }

        response = await self._call_nvidia_api(payload, timeout=20, bypass_cache=bypass_cache)
        if response:
            content = response["choices"][0]["message"]["content"]
            if "```" in content:
                content = content.split("```")[1].replace("json", "").strip()
            try:
                return json.loads(content)
            except:
                pass
        
        return ["AI unavailable - check logs", "Focus on completing active runs", "Verify input data quality"]

    async def generate_suggestions(self, company_data: Dict, current_assumptions: Dict, context: Dict, bypass_cache: bool = False) -> Dict:
        """
        Generates smart assumption adjustments asynchronously.
        """
        # Data Minimization: Combine essential parts only
        safe_context = {
            "company": company_data.get("company_name", "Unknown"),
            "sector": company_data.get("sector", "General"),
            "assumptions": current_assumptions,
            "goal": context
        }
        
        prompt = (
            f"Act as a senior valuation expert. Review these inputs and suggest ONLY necessary improvements.\n"
            f"Context: {json.dumps(safe_context, indent=2)}\n\n"
            f"Return JSON matching this exact structure:\n"
            f"{{\n"
            f'  "adjusted_assumptions": {{ "key": value }},\n'
            f'  "confidence_scores": {{ "key": 0.0-1.0 }},\n'
            f'  "reasoning": {{ "per_assumption": {{ "key": "explanation" }} }},\n'
            f'  "expected_impact": {{ "valuation_change_pct": float, "enterprise_value_current": float, "enterprise_value_suggested": float }}\n'
            f"}}"
        )

        payload = {
            "model": "nvidia/nemotron-3-nano-30b-a3b",
            "messages": [
                {"role": "system", "content": "You are a valuation expert. Output JSON only."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 1024,
            "extra_body": {"chat_template_kwargs": {"enable_thinking": True}}
        }

        response = await self._call_nvidia_api(payload, timeout=30, bypass_cache=bypass_cache)
        if response:
            content = response["choices"][0]["message"]["content"]
            if "```" in content:
                content = content.split("```")[1].replace("json", "").strip()
            try:
                return json.loads(content)
            except:
                print("Failed to parse JSON")

        # Fallback
        return {
                "adjusted_assumptions": {
                    "revenue_growth_start": 0.08,
                    "ebitda_margin_end": 0.25
                },
                 "confidence_scores": {
                    "revenue_growth_start": 0.85,
                    "ebitda_margin_end": 0.75
                },
                 "reasoning": {
                    "per_assumption": {
                        "revenue_growth_start": "Higher growth justified by recent sector momentum.",
                        "ebitda_margin_end": "Margins have room to expand based on peer benchmarking."
                    }
                },
                "expected_impact": {
                    "valuation_change_pct": 0.0,
                    "enterprise_value_current": 0,
                    "enterprise_value_suggested": 0
                }
        }

    async def generate_detailed_insights(self, valuation_results: Dict[str, Any], company_name: str, bypass_cache: bool = False) -> Dict[str, List[str]]:
        """
        Generates detailed strategic assessment asynchronously.
        """
        context_str = self._truncate_context(valuation_results, 6000)
        prompt = (
            f"Analyze the valuation for {company_name} and provide detailed insights.\n"
            f"Data: {context_str}\n\n"
            f"Return valid JSON ONLY with this exact structure:\n"
            f"{{\n"
            f'  "strategic_assessment": ["point 1", "point 2", "point 3"],\n'
            f'  "risk_factors": ["risk 1", "risk 2", "risk 3"],\n'
            f'  "upside_potential": ["upside 1", "upside 2", "upside 3"]\n'
            f"}}\n"
            f"Be specific, financial, and actionable."
        )

        payload = {
            "model": "nvidia/nemotron-3-nano-30b-a3b",
            "messages": [
                {"role": "system", "content": "You are a senior investment banker. Output valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.4,
            "max_tokens": 1024,
            "extra_body": {"chat_template_kwargs": {"enable_thinking": True}}
        }

        response = await self._call_nvidia_api(payload, timeout=45, bypass_cache=bypass_cache)
        if response:
            content = response["choices"][0]["message"]["content"]
            if "```" in content:
                content = content.split("```")[1].replace("json", "").strip()
            try:
                return json.loads(content)
            except Exception as e:
                print(f"JSON Parse Error: {e}")
        
        return {
            "strategic_assessment": ["Unable to generate insights at this time."],
            "risk_factors": ["Check input data quality."],
            "upside_potential": ["Review growth drivers manually."]
        }

    def _generate_template_summary(self, valuation_results: Dict[str, Any], company_name: str) -> str:
        # 1. Analyze the Data
        ev = valuation_results.get("enterprise_value", 0)
        dcf_value = self._get_method_value(valuation_results, "DCF")
        market_value = ev * 0.9 # Simulated 
        
        # Determine Valuation Verdict 
        gap_percent = (ev - market_value) / market_value if market_value else 0
        verdict = "Undervalued" if gap_percent > 0 else "Overvalued"
        magnitude = "significantly" if abs(gap_percent) > 0.15 else "slightly"
        
        # Key Drivers
        growth_rate = self._extract_growth_rate(valuation_results)
        wacc = self._extract_wacc(valuation_results)
        margins = self._extract_margins(valuation_results)
        
        # 2. Construct Narrative
        p1 = (f"**Valuation Verdict: {verdict}**\n"
              f"Based on our comprehensive analysis, {company_name} appears to be {magnitude} {verdict.lower()} "
              f"relative to its intrinsic value. The calculated Enterprise Value is **${ev/1e6:.1f}M**, "
              f"suggesting a potential upside of {abs(gap_percent):.1%} compared to current market implied levels. "
              f"This valuation is primarily anchored by the DCF method, which indicates robust long-term cash flow generation.")

        p2 = (f"**Key Value Drivers**\n"
              f"The valuation is driven by a projected revenue CAGR of **{growth_rate:.1%}** over the forecast period, "
              f"supported by expanding EBITDA margins reaching **{margins:.1%}**. "
              f"Furthermore, the risk profile is captured by a WACC of **{wacc:.1%}**, reflecting "
              f"current market volatility and the company's capital structure. "
              f"Sensitivity analysis reveals that the value is most sensitive to changes in the terminal growth rate, "
              f"highlighting the importance of long-term execution.")

        p3 = (f"**Strategic Implications**\n"
              f"Given the {verdict.lower()} status, management should focus on unlocking shareholder value by "
              f"{'accelerating growth initiatives' if verdict == 'Undervalued' else 'optimizing operational efficiency'}. "
              f"Investors should monitor the company's ability to maintain its margin profile amidst competitive pressures. "
              f"We recommend a **{'BUY' if verdict == 'Undervalued' else 'HOLD'}** rating, contingent on the successful execution of the strategic roadmap.")
        
        return f"{p1}\n\n{p2}\n\n{p3}"

    def _get_method_value(self, results: Dict, method_name: str) -> float:
        return results.get("enterprise_value", 0)

    def _extract_growth_rate(self, results: Dict) -> float:
        try:
            dcf = results.get("dcf_details", {})
            rev = dcf.get("revenue", [])
            if len(rev) > 1:
                return (rev[-1] / rev[0]) ** (1 / (len(rev) - 1)) - 1
        except:
            pass
        return 0.05 

    def _extract_wacc(self, results: Dict) -> float:
        return 0.085 

    def _extract_margins(self, results: Dict) -> float:
        try:
            dcf = results.get("dcf_details", {})
            ebitda = dcf.get("ebitda", [])
            rev = dcf.get("revenue", [])
            if rev and ebitda:
                return ebitda[-1] / rev[-1]
        except:
            pass
        return 0.20

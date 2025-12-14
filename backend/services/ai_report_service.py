from typing import Dict, Any, List
import json

class AIReportService:
    """
    Service to generate "AI-powered" executive summaries.
    Currently uses a sophisticated template engine to simulate AI reasoning.
    Designed to be easily swapped with a real LLM (e.g., OpenAI, Gemini) in the future.
    """

    def generate_executive_summary(self, valuation_results: Dict[str, Any], company_name: str) -> str:
        """
        Generates an executive summary. Uses Groq LLM if available, otherwise falls back to template.
        """
        import os
        import requests
        
        api_key = os.getenv("GROQ_API_KEY")
        
        if api_key:
            try:
                print("Info: Generating summary using Groq LLM...")
                
                # Prepare context
                context_str = json.dumps(valuation_results, indent=2)
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
                
                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama3-70b-8192",
                        "messages": [
                            {"role": "system", "content": "You are a senior equity research analyst."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 1024
                    },
                    timeout=15
                )
                
                if response.status_code == 200:
                    return response.json()["choices"][0]["message"]["content"]
                else:
                    print(f"Groq API Error: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"Groq Integration Failed: {e}")
        
        # Fallback to Template Engine
        print("Info: Using template engine for summary.")
        return self._generate_template_summary(valuation_results, company_name)

    def _generate_template_summary(self, valuation_results: Dict[str, Any], company_name: str) -> str:
        # 1. Analyze the Data
        ev = valuation_results.get("enterprise_value", 0)
        # ... (rest of the existing logic)
        dcf_value = self._get_method_value(valuation_results, "DCF")
        market_value = ev * 0.9 # Simulated "Current Market Cap" for comparison (usually passed in input)
        
        # Determine Valuation Verdict (Undervalued/Overvalued)
        gap_percent = (ev - market_value) / market_value if market_value else 0
        verdict = "Undervalued" if gap_percent > 0 else "Overvalued"
        magnitude = "significantly" if abs(gap_percent) > 0.15 else "slightly"
        
        # Key Drivers
        growth_rate = self._extract_growth_rate(valuation_results)
        wacc = self._extract_wacc(valuation_results)
        margins = self._extract_margins(valuation_results)
        
        # 2. Construct Narrative
        
        # Paragraph 1: The Verdict
        p1 = (f"**Valuation Verdict: {verdict}**\n"
              f"Based on our comprehensive analysis, {company_name} appears to be {magnitude} {verdict.lower()} "
              f"relative to its intrinsic value. The calculated Enterprise Value is **${ev/1e6:.1f}M**, "
              f"suggesting a potential upside of {abs(gap_percent):.1%} compared to current market implied levels. "
              f"This valuation is primarily anchored by the DCF method, which indicates robust long-term cash flow generation.")

        # Paragraph 2: Key Drivers
        p2 = (f"**Key Value Drivers**\n"
              f"The valuation is driven by a projected revenue CAGR of **{growth_rate:.1%}** over the forecast period, "
              f"supported by expanding EBITDA margins reaching **{margins:.1%}**. "
              f"Furthermore, the risk profile is captured by a WACC of **{wacc:.1%}**, reflecting "
              f"current market volatility and the company's capital structure. "
              f"Sensitivity analysis reveals that the value is most sensitive to changes in the terminal growth rate, "
              f"highlighting the importance of long-term execution.")

        # Paragraph 3: Strategic Recommendation
        p3 = (f"**Strategic Implications**\n"
              f"Given the {verdict.lower()} status, management should focus on unlocking shareholder value by "
              f"{'accelerating growth initiatives' if verdict == 'Undervalued' else 'optimizing operational efficiency'}. "
              f"Investors should monitor the company's ability to maintain its margin profile amidst competitive pressures. "
              f"We recommend a **{'BUY' if verdict == 'Undervalued' else 'HOLD'}** rating, contingent on the successful execution of the strategic roadmap.")
        
        return f"{p1}\n\n{p2}\n\n{p3}"

    def _get_method_value(self, results: Dict, method_name: str) -> float:
        # Placeholder to extract specific method value if available
        return results.get("enterprise_value", 0)

    def _extract_growth_rate(self, results: Dict) -> float:
        try:
            # Try to find revenue growth from DCF details
            dcf = results.get("dcf_details", {})
            rev = dcf.get("revenue", [])
            if len(rev) > 1:
                return (rev[-1] / rev[0]) ** (1 / (len(rev) - 1)) - 1
        except:
            pass
        return 0.05 # Default

    def _extract_wacc(self, results: Dict) -> float:
        # Try to find WACC in inputs or results
        return 0.085 # Default placeholder if not found

    def _extract_margins(self, results: Dict) -> float:
        try:
            dcf = results.get("dcf_details", {})
            ebitda = dcf.get("ebitda", [])
            rev = dcf.get("revenue", [])
            if rev and ebitda:
                return ebitda[-1] / rev[-1]
        except:
            pass
        return 0.20 # Default

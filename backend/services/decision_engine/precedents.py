
PRECEDENT_IMPACTS = {
    "CASH_RUNWAY_3MO": {
        "description": "Cash runway < 3 months",
        "outcomes": [
            {"probability": 0.42, "impact": "Distressed equity dilution (40-60%)"},
            {"probability": 0.31, "impact": "Debt covenant breach & acceleration"},
            {"probability": 0.27, "impact": "Orderly sale of assets (70-80% of value)"}
        ],
        "data_source": "Analysis of 150 private companies (2008-2023)"
    },
    "FORECAST_MISS_30PCT": {
        "description": "Revenue miss > 30% vs forecast",
        "outcomes": [
            {"probability": 0.58, "impact": "Valuation markdown of 25-40% within 6 months"},
            {"probability": 0.33, "impact": "Management turnover within 12 months"},
            {"probability": 0.09, "impact": "Survival without material changes"}
        ],
        "data_source": "Public company data (1998-2023)"
    }
}

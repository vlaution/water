import json
import random
import pandas as pd
from datetime import datetime, timedelta

def generate_anonymized_dataset(num_records=1000):
    sectors = ["SaaS", "Biotech", "Consumer", "Fintech", "Manufacturing"]
    data = []

    for i in range(num_records):
        sector = random.choice(sectors)
        
        # Base metrics depending on sector
        if sector == "SaaS":
            revenue_growth = random.normalvariate(0.20, 0.10) # Mean 20%, SD 10%
            ebitda_margin = random.normalvariate(0.10, 0.15)
        elif sector == "Biotech":
            revenue_growth = random.normalvariate(0.10, 0.20)
            ebitda_margin = random.normalvariate(-0.10, 0.20) # Often negative
        else:
            revenue_growth = random.normalvariate(0.05, 0.05)
            ebitda_margin = random.normalvariate(0.15, 0.05)

        # Inject anomalies (5% chance)
        is_anomaly = False
        anomaly_type = "None"
        
        if random.random() < 0.05:
            is_anomaly = True
            anomaly_type = "HighGrowth_LowMargin"
            revenue_growth = 0.60 # Extreme growth
            ebitda_margin = -0.30 # Extreme burn

        record = {
            "id": i + 1,
            "sector": sector,
            "revenue_growth": round(revenue_growth, 4),
            "ebitda_margin": round(ebitda_margin, 4),
            "wacc": round(random.normalvariate(0.08, 0.02), 4),
            "terminal_growth": round(random.normalvariate(0.025, 0.005), 4),
            "is_anomaly": is_anomaly,
            "anomaly_type": anomaly_type,
            "generated_at": datetime.utcnow().isoformat()
        }
        data.append(record)

    return data

if __name__ == "__main__":
    dataset = generate_anonymized_dataset()
    
    # Save to JSON
    with open("historical_valuations.json", "w") as f:
        json.dump(dataset, f, indent=2)
    
    # Save to CSV for easier viewing
    df = pd.DataFrame(dataset)
    df.to_csv("historical_valuations.csv", index=False)
    
    print(f"Generated {len(dataset)} records. Saved to historical_valuations.json and .csv")

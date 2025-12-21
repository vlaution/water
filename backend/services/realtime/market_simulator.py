import asyncio
import random
import os
from backend.services.realtime.realtime_service import manager

# Mock initial data
mock_prices = {
    "AAPL": 150.0,
    "MSFT": 300.0,
    "GOOGL": 2500.0,
    "AMZN": 3400.0,
    "TSLA": 700.0
}

async def simulate_market_data():
    """
    Background task that simulates market data updates.
    """
    print("Starting market simulation background task...")
    while True:
        # Pick 1-3 random tickers to update
        tickers_to_update = random.sample(list(mock_prices.keys()), k=random.randint(1, 3))
        
        updates = []
        for ticker in tickers_to_update:
            # Fluctuate price by -0.5% to +0.5%
            # Fluctuate price based on configured volatility
            volatility = float(os.getenv("MARKET_VOLATILITY", "0.005"))
            change_pct = random.uniform(-volatility, volatility)
            current_price = mock_prices[ticker]
            new_price = current_price * (1 + change_pct)
            mock_prices[ticker] = new_price
            
            updates.append({
                "ticker": ticker,
                "price": round(new_price, 2),
                "change_percent": round(change_pct * 100, 2)
            })
            
            
        # Broadcast simulation event
        message = {
            "type": "market_update",
            "data": updates
        }
        
        await manager.broadcast(message)

        # Randomly generate an alert (20% chance)
        if random.random() < 0.2:
            alert_ticker = random.choice(list(mock_prices.keys()))
            alert_type = random.choice(["Surge", "Drop", "Volatile"])
            severity = "info" if alert_type == "Volatile" else "warning"
            
            alert_msg = {
                "type": "alert",
                "data": {
                    "title": f"Market Alert: {alert_ticker}",
                    "message": f"{alert_ticker} experiencing significant {alert_type.lower()}.",
                    "severity": severity
                }
            }
            await manager.broadcast(alert_msg)
        
        # Wait 2-5 seconds before next update
        # Wait based on configured interval
        min_interval = float(os.getenv("MARKET_SIMULATION_MIN_INTERVAL", "2.0"))
        max_interval = float(os.getenv("MARKET_SIMULATION_MAX_INTERVAL", "5.0"))
        await asyncio.sleep(random.uniform(min_interval, max_interval))

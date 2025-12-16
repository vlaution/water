from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from backend.services.financial_data.market_data_service import market_data_service
from backend.services.financial_data.cache import cache
import logging

logging.basicConfig()
logger = logging.getLogger("scheduler")
logger.setLevel(logging.INFO)

class SchedulerService:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.is_running = False

    def start(self):
        if not self.is_running:
            self.setup_jobs()
            self.scheduler.start()
            self.is_running = True
            logger.info("Scheduler started.")

    def stop(self):
        if self.is_running:
            self.scheduler.shutdown()
            self.is_running = False
            logger.info("Scheduler stopped.")

    def setup_jobs(self):
        # Schedule Market Data Refresh at 16:15 ET (Market Close)
        # Note: Server time might be UTC, so we should be careful. 
        # Assuming server is UTC, 16:15 ET is roughly 20:15 or 21:15 UTC.
        # For simplicity, we'll just run it every day at a fixed time or interval for now.
        # Let's say 21:15 UTC (approx 4:15 PM ET)
        
        self.scheduler.add_job(
            self.refresh_market_data,
            CronTrigger(hour=21, minute=15),
            id="refresh_market_data",
            replace_existing=True
        )
        logger.info("Job 'refresh_market_data' scheduled for 21:15 UTC.")

    def refresh_market_data(self):
        logger.info("Executing job: refresh_market_data")
        try:
            # 1. Clear Cache for Market Data
            # We know the prefixes based on method names or explicit keys
            # fetch_interest_rates -> fetch_interest_rates
            # fetch_leverage_multiples -> fetch_leverage_multiples
            # fetch_exit_multiples -> fetch_exit_multiples
            
            cache.clear_pattern("fetch_interest_rates")
            cache.clear_pattern("fetch_leverage_multiples")
            cache.clear_pattern("fetch_exit_multiples")
            
            # 2. Re-fetch Data (this will repopulate cache)
            market_data_service.fetch_interest_rates()
            market_data_service.fetch_leverage_multiples()
            market_data_service.fetch_exit_multiples()
            
            logger.info("Market data refreshed successfully.")
        except Exception as e:
            logger.error(f"Failed to refresh market data: {e}")

scheduler_service = SchedulerService()

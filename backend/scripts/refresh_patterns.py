import sys
import os
import logging

# Add parent directory to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.services.ai.pattern_service import PatternRecognitionService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('pattern_refresh.log')
    ]
)
logger = logging.getLogger(__name__)

def main():
    logger.info("Starting pattern refresh job...")
    try:
        service = PatternRecognitionService()
        service.train_patterns()
        logger.info("Pattern refresh completed successfully.")
    except Exception as e:
        logger.error(f"Pattern refresh failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

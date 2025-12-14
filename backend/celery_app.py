import os
from celery import Celery
from celery.schedules import crontab

# Get Redis URL from environment or default to localhost
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "valuation_worker",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_default_queue='default',
    task_queues={
        'default': {'exchange': 'default', 'routing_key': 'default'},
        'high_priority': {'exchange': 'high_priority', 'routing_key': 'high_priority'},
        'low_priority': {'exchange': 'low_priority', 'routing_key': 'low_priority'},
    },
    task_routes={
        'services.metrics.aggregator.*': {'queue': 'default'},
        'services.metrics.retention.*': {'queue': 'low_priority'},
        'services.alerting.*': {'queue': 'high_priority'},
    }
)

# Define periodic tasks
celery_app.conf.beat_schedule = {
    "aggregate-metrics-every-5-minutes": {
        "task": "backend.services.metrics.aggregator.aggregate_metrics",
        "schedule": crontab(minute="*/5"),
    },
}

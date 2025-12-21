#!/bin/bash
# Add parent directory to Python path so it can find 'backend' module
# Ensure we are in the script's directory
cd "$(dirname "$0")"

# Export PYTHONPATH to include the current directory (which is inside backend/) and the parent
export PYTHONPATH=$PYTHONPATH:.

# Run with Gunicorn for production performance
# Using Uvicorn workers
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT

#!/bin/bash
# Add parent directory to Python path so it can find 'backend' module
export PYTHONPATH=/opt/render/project/src:$PYTHONPATH
uvicorn main:app --host 0.0.0.0 --port $PORT

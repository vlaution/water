# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
# libpq-dev is required for psycopg2 (PostgreSQL)
# build-essential is required for compiling some python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into a backend/ folder in the container
COPY . backend/

# Set the PYTHONPATH to include the root directory so 'backend' is a package
ENV PYTHONPATH=/app

# Set the working directory to the backend folder for execution
WORKDIR /app/backend

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run main:app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

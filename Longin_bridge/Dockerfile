FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if needed (e.g. for some python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=src/main.py
ENV PORT=5001

EXPOSE 5001

CMD ["python", "src/main.py"]

# FROM python:3.11-slim

# WORKDIR /app

# # Install system deps for TensorFlow
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     gcc g++ && \
#     rm -rf /var/lib/apt/lists/*


# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# COPY main.py .

# EXPOSE 8501

# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8501"]

# Menggunakan image resmi TensorFlow yang sudah include CUDA dan cuDNN
FROM tensorflow/tensorflow:2.15.0-gpu

WORKDIR /app

# Install dependencies sistem dasar jika diperlukan
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements dan install dependencies Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy seluruh source code microservice
COPY . .

EXPOSE 8501

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8501"]
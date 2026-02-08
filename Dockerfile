# Use Python 3.10
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# --- FIX: Use 'libgl1' instead of 'libgl1-mesa-glx' ---
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Create user
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

# Copy requirements
COPY --chown=user requirements.txt .

# Install CPU-only PyTorch (Fast & Small)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install other requirements
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY --chown=user . .

# Expose port
EXPOSE 7860

# Start server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
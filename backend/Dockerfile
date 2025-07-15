FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required by Playwright
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    gnupg \
    build-essential \
    libssl-dev \
    libnss3 \
    libatk-bridge2.0-0 \
    libxss1 \
    libasound2 \
    libxshmfence1 \
    libxrandr2 \
    libgtk-3-0 \
    libdrm2 \
    libgbm1 \
    libxcb-dri3-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libx11-xcb1 \
    libxrender1 \
    libxi6 \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils \
    ca-certificates \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Install browser binaries (Chromium, Firefox, WebKit)
RUN playwright install
RUN playwright install-deps

# Copy the rest of your backend code
COPY . .

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "backend.asgi:application"]


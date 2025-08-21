#!/bin/bash

# Advanced Instagram Content Scraper Runner Script

echo "🚀 Starting Advanced Instagram Content Scraper..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if Chrome is installed
if ! command -v google-chrome &> /dev/null && ! command -v chromium-browser &> /dev/null; then
    echo "⚠️  Chrome/Chromium not found. The scraper may not work properly."
    echo "Please install Chrome or Chromium browser."
fi

# Check if virtual environment exists, create if not
if [ ! -d "instagram_finder_env" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv instagram_finder_env
fi

# Activate virtual environment and install dependencies
echo "📦 Activating virtual environment and installing dependencies..."
source instagram_finder_env/bin/activate
pip install -r requirements_instagram_finder.txt

# Run the advanced Instagram scraper
echo "🔍 Running Advanced Instagram Content Scraper..."
echo "⚠️  This scraper will download actual Instagram content (images, videos, posts)"
echo "⚠️  It uses Selenium with undetected Chrome driver to bypass restrictions"
echo "⚠️  Test mode: Only processing first 3 brands"
python advanced_instagram_scraper.py

echo "✅ Advanced Instagram Content Scraper completed!"
echo "📁 Check the 'downloads/instagram_data' folder for downloaded content."

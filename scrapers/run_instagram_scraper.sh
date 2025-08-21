#!/bin/bash

# Instagram Content Scraper Runner Script

echo "🚀 Starting Instagram Content Scraper..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
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

# Run the Instagram scraper
echo "🔍 Running Instagram Content Scraper..."
python instagram_scraper.py

echo "✅ Instagram Content Scraper completed!"
echo "📁 Check the 'downloads/instagram_data' folder for downloaded content."

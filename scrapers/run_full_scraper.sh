#!/bin/bash

# Full Instagram Scraper Runner Script

echo "🚀 Starting Full Instagram Content Scraper..."

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

# Run the full Instagram scraper
echo "🔍 Running Full Instagram Content Scraper..."
echo "⚠️  This scraper will download Instagram content for ALL brands"
echo "⚠️  It uses Instagram's mobile API to bypass restrictions"
echo "⚠️  This will take a while - processing 145+ brands"
echo "⚠️  Each brand will download 6 posts with images/videos"
python full_instagram_scraper.py

echo "✅ Full Instagram Content Scraper completed!"
echo "📁 Check the 'downloads/instagram_data' folder for downloaded content."
echo "📊 You should now have Instagram content for all your fashion brands!"

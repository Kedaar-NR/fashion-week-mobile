#!/usr/bin/env python3
"""
Instagram Content Scraper
Downloads images and videos from Instagram accounts
"""

import requests
import json
import os
import time
import re
from urllib.parse import urlparse, parse_qs
from bs4 import BeautifulSoup
import urllib.request
from pathlib import Path
import logging

class InstagramScraper:
    def __init__(self, output_dir="downloads/instagram_data"):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        self.output_dir = output_dir
        self.setup_logging()
        
    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('instagram_scraper.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def extract_username_from_url(self, instagram_url):
        """Extract username from Instagram URL"""
        # Handle different URL formats
        if '/p/' in instagram_url:
            # Post URL, extract username from the path
            path = urlparse(instagram_url).path
            parts = path.split('/')
            if len(parts) > 1:
                return parts[1]
        elif 'instagram.com/' in instagram_url:
            # Profile URL
            path = urlparse(instagram_url).path
            username = path.strip('/')
            if username:
                return username
        
        return None
    
    def get_instagram_profile_data(self, username):
        """Get Instagram profile data using web scraping"""
        try:
            url = f"https://www.instagram.com/{username}/"
            self.logger.info(f"Fetching profile data for: {username}")
            
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            # Look for JSON data in the HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find script tags containing JSON data
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string and 'window._sharedData = ' in script.string:
                    json_str = script.string.replace('window._sharedData = ', '').rstrip(';')
                    data = json.loads(json_str)
                    
                    if 'entry_data' in data and 'ProfilePage' in data['entry_data']:
                        profile_data = data['entry_data']['ProfilePage'][0]['graphql']['user']
                        return profile_data
            
            self.logger.warning(f"Could not extract profile data for {username}")
            return None
            
        except Exception as e:
            self.logger.error(f"Error fetching profile data for {username}: {e}")
            return None
    
    def download_media(self, url, filepath):
        """Download media file from URL"""
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            
            # Download the file
            urllib.request.urlretrieve(url, filepath)
            self.logger.info(f"Downloaded: {filepath}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error downloading {url}: {e}")
            return False
    
    def process_instagram_post(self, post_data, brand_folder):
        """Process a single Instagram post"""
        try:
            # Get post ID for filename
            post_id = post_data.get('id', f"post_{int(time.time())}")
            
            # Handle different media types
            if post_data.get('is_video'):
                # Video post
                video_url = post_data.get('video_url')
                if video_url:
                    filename = f"{post_id}.mp4"
                    filepath = os.path.join(brand_folder, 'videos', filename)
                    return self.download_media(video_url, filepath)
            else:
                # Image post
                image_url = post_data.get('display_url')
                if image_url:
                    filename = f"{post_id}.jpg"
                    filepath = os.path.join(brand_folder, 'images', filename)
                    return self.download_media(image_url, filepath)
            
            return False
            
        except Exception as e:
            self.logger.error(f"Error processing post: {e}")
            return False
    
    def scrape_brand_instagram(self, brand_name, instagram_url):
        """Scrape Instagram content for a specific brand"""
        try:
            # Extract username from URL
            username = self.extract_username_from_url(instagram_url)
            if not username:
                self.logger.error(f"Could not extract username from URL: {instagram_url}")
                return False
            
            # Create brand folder
            brand_folder = os.path.join(self.output_dir, brand_name)
            images_folder = os.path.join(brand_folder, 'images')
            videos_folder = os.path.join(brand_folder, 'videos')
            
            os.makedirs(images_folder, exist_ok=True)
            os.makedirs(videos_folder, exist_ok=True)
            
            self.logger.info(f"Created folders for {brand_name}")
            
            # Get profile data
            profile_data = self.get_instagram_profile_data(username)
            if not profile_data:
                self.logger.warning(f"No profile data found for {brand_name}")
                return False
            
            # Get recent posts (limited due to Instagram restrictions)
            posts = profile_data.get('edge_owner_to_timeline_media', {}).get('edges', [])
            
            self.logger.info(f"Found {len(posts)} posts for {brand_name}")
            
            # Process each post
            downloaded_count = 0
            for post in posts[:20]:  # Limit to 20 most recent posts
                post_data = post['node']
                if self.process_instagram_post(post_data, brand_folder):
                    downloaded_count += 1
                
                # Be respectful with delays
                time.sleep(2)
            
            self.logger.info(f"Downloaded {downloaded_count} media files for {brand_name}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error scraping {brand_name}: {e}")
            return False
    
    def read_brands_list(self, brands_file="downloads/brands-list.md"):
        """Read brands and Instagram links from the markdown file"""
        brands = {}
        
        try:
            with open(brands_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract brand names and Instagram links
            lines = content.split('\n')
            for line in lines:
                if '**' in line and 'Instagram' in line:
                    # Extract brand name
                    brand_match = re.search(r'\*\*(.*?)\*\*', line)
                    if brand_match:
                        brand_name = brand_match.group(1)
                        
                        # Extract Instagram URL
                        url_match = re.search(r'https://www\.instagram\.com/[^\s)]+', line)
                        if url_match:
                            instagram_url = url_match.group(0)
                            brands[brand_name] = instagram_url
                        elif 'No official Instagram link found' in line or 'No specific Instagram link found' in line:
                            brands[brand_name] = None
            
            return brands
            
        except Exception as e:
            self.logger.error(f"Error reading brands file: {e}")
            return {}
    
    def run(self, brands_file="downloads/brands-list.md"):
        """Main method to scrape Instagram content for all brands"""
        self.logger.info("Starting Instagram Content Scraper...")
        
        # Read brands list
        brands = self.read_brands_list(brands_file)
        
        if not brands:
            self.logger.error("No brands found in the file!")
            return
        
        self.logger.info(f"Found {len(brands)} brands with Instagram links")
        
        # Process each brand
        successful_scrapes = 0
        for i, (brand_name, instagram_url) in enumerate(brands.items(), 1):
            if not instagram_url:
                self.logger.info(f"Skipping {brand_name} - no Instagram link")
                continue
            
            self.logger.info(f"\n[{i}/{len(brands)}] Processing: {brand_name}")
            
            if self.scrape_brand_instagram(brand_name, instagram_url):
                successful_scrapes += 1
            
            # Be respectful with delays between brands
            time.sleep(5)
        
        self.logger.info(f"\nCompleted! Successfully scraped {successful_scrapes} out of {len(brands)} brands")

def main():
    """Main function to run the Instagram scraper"""
    scraper = InstagramScraper()
    scraper.run()

if __name__ == "__main__":
    main()

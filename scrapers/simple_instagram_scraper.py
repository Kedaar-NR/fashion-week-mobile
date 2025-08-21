#!/usr/bin/env python3
"""
Simple Instagram Content Scraper
Downloads profile pictures and basic info from Instagram accounts
"""

import requests
import json
import os
import time
import re
from urllib.parse import urlparse
from bs4 import BeautifulSoup
import urllib.request
import logging

class SimpleInstagramScraper:
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
                logging.FileHandler('simple_instagram_scraper.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def extract_username_from_url(self, instagram_url):
        """Extract username from Instagram URL"""
        try:
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
                if username and not username.startswith('p/'):
                    return username
            
            return None
        except Exception as e:
            self.logger.error(f"Error extracting username from {instagram_url}: {e}")
            return None
    
    def download_profile_picture(self, username, brand_folder):
        """Download profile picture for a username"""
        try:
            # Try to get profile picture URL
            profile_url = f"https://www.instagram.com/{username}/"
            
            response = self.session.get(profile_url, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Look for profile picture in meta tags
                meta_tags = soup.find_all('meta', property='og:image')
                if meta_tags:
                    profile_pic_url = meta_tags[0].get('content')
                    if profile_pic_url:
                        # Download profile picture
                        filename = f"{username}_profile.jpg"
                        filepath = os.path.join(brand_folder, filename)
                        
                        urllib.request.urlretrieve(profile_pic_url, filepath)
                        self.logger.info(f"Downloaded profile picture for {username}")
                        return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Error downloading profile picture for {username}: {e}")
            return False
    
    def create_brand_info_file(self, brand_name, instagram_url, brand_folder):
        """Create a JSON file with brand information"""
        try:
            username = self.extract_username_from_url(instagram_url)
            
            brand_info = {
                'brand_name': brand_name,
                'instagram_url': instagram_url,
                'instagram_username': username,
                'scraped_at': time.strftime('%Y-%m-%d %H:%M:%S'),
                'note': 'This is basic brand information. Instagram content scraping is limited due to platform restrictions.'
            }
            
            info_file = os.path.join(brand_folder, 'brand_info.json')
            with open(info_file, 'w', encoding='utf-8') as f:
                json.dump(brand_info, f, indent=2)
            
            self.logger.info(f"Created brand info file for {brand_name}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error creating brand info for {brand_name}: {e}")
            return False
    
    def scrape_brand_instagram(self, brand_name, instagram_url):
        """Scrape basic Instagram info for a specific brand"""
        try:
            # Extract username from URL
            username = self.extract_username_from_url(instagram_url)
            if not username:
                self.logger.error(f"Could not extract username from URL: {instagram_url}")
                return False
            
            # Create brand folder
            brand_folder = os.path.join(self.output_dir, brand_name)
            os.makedirs(brand_folder, exist_ok=True)
            
            self.logger.info(f"Processing {brand_name} (@{username})")
            
            # Create brand info file
            self.create_brand_info_file(brand_name, instagram_url, brand_folder)
            
            # Try to download profile picture
            self.download_profile_picture(username, brand_folder)
            
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
        self.logger.info("Starting Simple Instagram Content Scraper...")
        
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
            time.sleep(3)
        
        self.logger.info(f"\nCompleted! Successfully processed {successful_scrapes} out of {len(brands)} brands")
        self.logger.info(f"Check the '{self.output_dir}' folder for downloaded content.")

def main():
    """Main function to run the simple Instagram scraper"""
    scraper = SimpleInstagramScraper()
    scraper.run()

if __name__ == "__main__":
    main()

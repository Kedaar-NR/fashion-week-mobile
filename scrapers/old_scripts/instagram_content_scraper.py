#!/usr/bin/env python3
"""
Instagram Content Scraper
Downloads Instagram content from verified lowheads brand accounts
Saves content in existing brand folders
"""

import requests
import json
import time
import os
import re
from urllib.parse import urlparse
from bs4 import BeautifulSoup
import logging
from datetime import datetime
import csv

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('instagram_content_scraper.log'),
        logging.StreamHandler()
    ]
)

class InstagramContentScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.0; AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"'
        })
        
        # Load verified Instagram accounts
        self.verified_accounts = self.load_verified_accounts()
        
        # Rate limiting
        self.request_delay = 3  # seconds between requests
        self.last_request_time = 0
        
    def load_verified_accounts(self):
        """Load verified Instagram accounts from the verification results"""
        try:
            with open('instagram_verification_results.json', 'r') as f:
                results = json.load(f)
            
            # Filter for public accounts only
            public_accounts = [r for r in results if r['status'] == 'public']
            logging.info(f"Loaded {len(public_accounts)} verified public Instagram accounts")
            return public_accounts
            
        except FileNotFoundError:
            logging.error("instagram_verification_results.json not found. Run instagram_verifier.py first.")
            return []
    
    def rate_limit(self):
        """Implement rate limiting"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.request_delay:
            sleep_time = self.request_delay - time_since_last
            time.sleep(sleep_time)
        self.last_request_time = time.time()
    
    def get_instagram_page_content(self, handle: str) -> str:
        """Get Instagram page content"""
        try:
            self.rate_limit()
            url = f"https://www.instagram.com/{handle}/"
            logging.info(f"Fetching: {url}")
            
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            return response.text
        except Exception as e:
            logging.error(f"Failed to fetch {handle}: {e}")
            return ""
    
    def extract_media_urls(self, html_content: str) -> tuple:
        """Extract image and video URLs from Instagram page"""
        images = []
        videos = []
        
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Method 1: Look for JSON-LD structured data
            json_ld_scripts = soup.find_all('script', type='application/ld+json')
            for script in json_ld_scripts:
                try:
                    data = json.loads(script.string)
                    if isinstance(data, dict) and 'image' in data:
                        if isinstance(data['image'], list):
                            images.extend(data['image'])
                        elif isinstance(data['image'], str):
                            images.append(data['image'])
                except json.JSONDecodeError:
                    continue
            
            # Method 2: Look for meta tags
            meta_images = soup.find_all('meta', property='og:image')
            for meta in meta_images:
                if meta.get('content'):
                    images.append(meta['content'])
            
            meta_videos = soup.find_all('meta', property='og:video')
            for meta in meta_videos:
                if meta.get('content'):
                    videos.append(meta['content'])
            
            # Method 3: Look for Instagram-specific data in scripts
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string and 'window._sharedData' in script.string:
                    try:
                        # Extract JSON data from the script
                        json_start = script.string.find('{')
                        json_end = script.string.rfind('}') + 1
                        if json_start != -1 and json_end != 0:
                            json_data = script.string[json_start:json_end]
                            data = json.loads(json_data)
                            self._extract_media_from_shared_data(data, images, videos)
                    except (json.JSONDecodeError, KeyError, TypeError):
                        continue
            
            # Method 4: Look for direct image and video tags
            img_tags = soup.find_all('img')
            for img in img_tags:
                src = img.get('src')
                if src and ('instagram' in src or 'cdninstagram' in src):
                    images.append(src)
            
            video_tags = soup.find_all('video')
            for video in video_tags:
                src = video.get('src')
                if src:
                    videos.append(src)
            
            # Remove duplicates while preserving order
            images = list(dict.fromkeys(images))
            videos = list(dict.fromkeys(videos))
            
            logging.info(f"Found {len(images)} images and {len(videos)} videos")
            
        except Exception as e:
            logging.error(f"Error extracting media URLs: {e}")
        
        return images, videos
    
    def _extract_media_from_shared_data(self, data: dict, images: list, videos: list):
        """Recursively extract media URLs from Instagram's shared data structure"""
        if isinstance(data, dict):
            for key, value in data.items():
                if key in ['display_url', 'src', 'url'] and isinstance(value, str):
                    if 'video' in value or '.mp4' in value:
                        videos.append(value)
                    else:
                        images.append(value)
                elif isinstance(value, (dict, list)):
                    self._extract_media_from_shared_data(value, images, videos)
        elif isinstance(data, list):
            for item in data:
                self._extract_media_from_shared_data(item, images, videos)
    
    def download_media(self, url: str, filepath: str) -> bool:
        """Download a single media file"""
        try:
            self.rate_limit()
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            return True
        except Exception as e:
            logging.error(f"Failed to download {url}: {e}")
            return False
    
    def get_file_extension(self, url: str) -> str:
        """Extract file extension from URL"""
        parsed = urlparse(url)
        path = parsed.path
        if '.' in path:
            return '.' + path.split('.')[-1].split('?')[0]
        return '.jpg'  # Default to jpg
    
    def scrape_brand_instagram(self, account: dict) -> dict:
        """Scrape Instagram content for a single brand"""
        handle = account['handle']
        original_brand = account['original_brand']
        
        logging.info(f"Scraping Instagram for brand: {original_brand} (@{handle})")
        
        # Check if brand folder exists in downloads
        brand_folder = os.path.join('downloads', original_brand)
        if not os.path.exists(brand_folder):
            logging.warning(f"Brand folder not found: {brand_folder}")
            return {
                'brand': original_brand,
                'handle': handle,
                'success': False,
                'error': 'Brand folder not found',
                'images': [],
                'videos': []
            }
        
        # Create IG subfolder in the brand folder
        ig_folder = os.path.join(brand_folder, 'IG')
        os.makedirs(ig_folder, exist_ok=True)
        
        # Get Instagram page content
        html_content = self.get_instagram_page_content(handle)
        if not html_content:
            return {
                'brand': original_brand,
                'handle': handle,
                'success': False,
                'error': 'Failed to fetch page content',
                'images': [],
                'videos': []
            }
        
        # Extract media URLs
        images, videos = self.extract_media_urls(html_content)
        
        # Download images
        downloaded_images = []
        for i, img_url in enumerate(images):
            if img_url.startswith('//'):
                img_url = 'https:' + img_url
            
            file_extension = self.get_file_extension(img_url)
            filename = f"instagram_image_{i+1:03d}{file_extension}"
            filepath = os.path.join(ig_folder, filename)
            
            if self.download_media(img_url, filepath):
                downloaded_images.append({
                    'url': img_url,
                    'filename': filename,
                    'local_path': filepath
                })
                logging.info(f"Downloaded image: {filename}")
        
        # Download videos
        downloaded_videos = []
        for i, video_url in enumerate(videos):
            if video_url.startswith('//'):
                video_url = 'https:' + video_url
            
            file_extension = self.get_file_extension(video_url)
            filename = f"instagram_video_{i+1:03d}{file_extension}"
            filepath = os.path.join(ig_folder, filename)
            
            if self.download_media(video_url, filepath):
                downloaded_videos.append({
                    'url': video_url,
                    'filename': filename,
                    'local_path': filepath
                })
                logging.info(f"Downloaded video: {filename}")
        
        return {
            'brand': original_brand,
            'handle': handle,
            'success': True,
            'images': downloaded_images,
            'videos': downloaded_videos,
            'total_images': len(downloaded_images),
            'total_videos': len(downloaded_videos)
        }
    
    def run_complete_scrape(self) -> dict:
        """Run the complete Instagram scraping process"""
        logging.info("Starting Instagram content scraping process...")
        
        all_data = {
            'scrape_date': datetime.now().isoformat(),
            'total_accounts': len(self.verified_accounts),
            'brands': {}
        }
        
        for i, account in enumerate(self.verified_accounts, 1):
            logging.info(f"[{i}/{len(self.verified_accounts)}] Processing: {account['original_brand']}")
            result = self.scrape_brand_instagram(account)
            all_data['brands'][result['brand']] = result
            
            # Add delay between requests
            time.sleep(2)
        
        # Save results
        self.save_results(all_data)
        
        # Print summary
        self.print_summary(all_data)
        
        return all_data
    
    def save_results(self, data: dict):
        """Save scraping results to files"""
        # Save as JSON
        json_file = 'instagram_content_results.json'
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        # Save as CSV
        csv_file = 'instagram_content_results.csv'
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Brand', 'Instagram Handle', 'Success', 'Images', 'Videos', 'Error'])
            
            for brand_data in data['brands'].values():
                writer.writerow([
                    brand_data['brand'],
                    brand_data['handle'],
                    brand_data['success'],
                    brand_data.get('total_images', 0),
                    brand_data.get('total_videos', 0),
                    brand_data.get('error', '')
                ])
        
        logging.info(f"Results saved to {json_file} and {csv_file}")
    
    def print_summary(self, data: dict):
        """Print a summary of the scraping results"""
        print("\n" + "=" * 60)
        print("INSTAGRAM CONTENT SCRAPING COMPLETE - SUMMARY")
        print("=" * 60)
        
        total_images = 0
        total_videos = 0
        successful_brands = 0
        failed_brands = 0
        
        for brand_data in data['brands'].values():
            if brand_data['success']:
                successful_brands += 1
                total_images += brand_data.get('total_images', 0)
                total_videos += brand_data.get('total_videos', 0)
            else:
                failed_brands += 1
        
        print(f"Total accounts processed: {len(data['brands'])}")
        print(f"Successful brands: {successful_brands}")
        print(f"Failed brands: {failed_brands}")
        print(f"Total images downloaded: {total_images}")
        print(f"Total videos downloaded: {total_videos}")
        print(f"Success rate: {successful_brands/len(data['brands'])*100:.1f}%")
        
        # Show top brands by content count
        sorted_brands = sorted(
            [b for b in data['brands'].values() if b['success']],
            key=lambda x: x.get('total_images', 0) + x.get('total_videos', 0),
            reverse=True
        )[:10]
        
        print("\nTop 10 brands by content count:")
        for brand_data in sorted_brands:
            total_content = brand_data.get('total_images', 0) + brand_data.get('total_videos', 0)
            print(f"  - {brand_data['brand']} (@{brand_data['handle']}): {total_content} items ({brand_data.get('total_images', 0)} images, {brand_data.get('total_videos', 0)} videos)")
        
        print(f"\n✓ Content saved to brand folders in 'downloads/' directory")
        print("=" * 60)

def main():
    """Main execution function"""
    scraper = InstagramContentScraper()
    
    if not scraper.verified_accounts:
        print("No verified Instagram accounts found. Run instagram_verifier.py first.")
        return
    
    # Run the complete scrape
    data = scraper.run_complete_scrape()
    
    print("\nInstagram content scraping completed!")
    print("Check the brand folders in 'downloads/' for Instagram content.")
    print("Check 'instagram_content_results.json' for detailed results.")
    
    return data

if __name__ == "__main__":
    main()

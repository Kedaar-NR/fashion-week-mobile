#!/usr/bin/env python3
"""
Advanced Instagram Content Scraper
Downloads ALL posts, images, and videos from Instagram accounts
Uses multiple techniques to bypass Instagram's anti-scraping measures
"""

import requests
import json
import time
import os
import re
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
import logging
from datetime import datetime
import csv
import base64
import hashlib

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('instagram_advanced_scraper.log'),
        logging.StreamHandler()
    ]
)

class InstagramAdvancedScraper:
    def __init__(self):
        self.session = requests.Session()
        
        # Advanced headers that mimic a real browser
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
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
            'sec-ch-ua-platform': '"macOS"',
            'Cache-Control': 'max-age=0'
        })
        
        # Instagram-specific headers
        self.instagram_headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
            'sec-ch-ua-platform': '"macOS"',
            'X-Requested-With': 'XMLHttpRequest',
            'X-IG-App-ID': '936619743392459',
            'X-IG-WWW-Claim': '0',
            'X-ASBD-ID': '129477',
            'X-CSRFToken': '',
            'X-Instagram-AJAX': '1'
        }
        
        # Rate limiting
        self.request_delay = 2  # seconds between requests
        self.last_request_time = 0
        
    def rate_limit(self):
        """Implement rate limiting"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.request_delay:
            sleep_time = self.request_delay - time_since_last
            time.sleep(sleep_time)
        self.last_request_time = time.time()
    
    def get_instagram_page_content(self, handle: str) -> str:
        """Get Instagram page content with advanced techniques"""
        try:
            self.rate_limit()
            url = f"https://www.instagram.com/{handle}/"
            logging.info(f"Fetching: {url}")
            
            # First request to get cookies and tokens
            response = self.session.get(url, headers=self.instagram_headers, timeout=30)
            response.raise_for_status()
            
            # Extract CSRF token
            csrf_match = re.search(r'"csrf_token":"([^"]+)"', response.text)
            if csrf_match:
                self.instagram_headers['X-CSRFToken'] = csrf_match.group(1)
            
            # Extract additional tokens
            ig_www_claim_match = re.search(r'"ig_www_claim":"([^"]+)"', response.text)
            if ig_www_claim_match:
                self.instagram_headers['X-IG-WWW-Claim'] = ig_www_claim_match.group(1)
            
            return response.text
        except Exception as e:
            logging.error(f"Failed to fetch {handle}: {e}")
            return ""
    
    def extract_all_media_urls(self, html_content: str) -> tuple:
        """Extract ALL image and video URLs using multiple techniques"""
        images = []
        videos = []
        
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Method 1: Look for Instagram's shared data
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
                    except (json.JSONDecodeError, KeyError, TypeError) as e:
                        logging.debug(f"Error parsing shared data: {e}")
                        continue
            
            # Method 2: Look for additional Instagram data
            for script in scripts:
                if script.string and 'window.__additionalDataLoaded' in script.string:
                    try:
                        # Extract additional data
                        json_start = script.string.find('{')
                        json_end = script.string.rfind('}') + 1
                        if json_start != -1 and json_end != 0:
                            json_data = script.string[json_start:json_end]
                            data = json.loads(json_data)
                            self._extract_media_from_additional_data(data, images, videos)
                    except (json.JSONDecodeError, KeyError, TypeError) as e:
                        logging.debug(f"Error parsing additional data: {e}")
                        continue
            
            # Method 3: Look for JSON-LD structured data
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
            
            # Method 4: Look for meta tags
            meta_images = soup.find_all('meta', property='og:image')
            for meta in meta_images:
                if meta.get('content'):
                    images.append(meta['content'])
            
            meta_videos = soup.find_all('meta', property='og:video')
            for meta in meta_videos:
                if meta.get('content'):
                    videos.append(meta['content'])
            
            # Method 5: Look for direct image and video tags
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
            
            # Method 6: Look for data attributes
            elements_with_data = soup.find_all(attrs={'data-src': True})
            for element in elements_with_data:
                data_src = element.get('data-src')
                if data_src and ('instagram' in data_src or 'cdninstagram' in data_src):
                    if 'video' in data_src or '.mp4' in data_src:
                        videos.append(data_src)
                    else:
                        images.append(data_src)
            
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
                if key in ['display_url', 'src', 'url', 'image_url', 'video_url'] and isinstance(value, str):
                    if 'video' in value or '.mp4' in value or 'video' in key:
                        videos.append(value)
                    else:
                        images.append(value)
                elif key in ['image_versions2', 'video_versions'] and isinstance(value, list):
                    for version in value:
                        if isinstance(version, dict) and 'url' in version:
                            if key == 'video_versions':
                                videos.append(version['url'])
                            else:
                                images.append(version['url'])
                elif isinstance(value, (dict, list)):
                    self._extract_media_from_shared_data(value, images, videos)
        elif isinstance(data, list):
            for item in data:
                self._extract_media_from_shared_data(item, images, videos)
    
    def _extract_media_from_additional_data(self, data: dict, images: list, videos: list):
        """Extract media from Instagram's additional data"""
        if isinstance(data, dict):
            for key, value in data.items():
                if key in ['media', 'items', 'posts'] and isinstance(value, list):
                    for item in value:
                        if isinstance(item, dict):
                            # Extract from media items
                            if 'image_versions2' in item:
                                for version in item['image_versions2']:
                                    if 'url' in version:
                                        images.append(version['url'])
                            
                            if 'video_versions' in item:
                                for version in item['video_versions']:
                                    if 'url' in version:
                                        videos.append(version['url'])
                            
                            # Extract from carousel media
                            if 'carousel_media' in item:
                                for carousel_item in item['carousel_media']:
                                    if 'image_versions2' in carousel_item:
                                        for version in carousel_item['image_versions2']:
                                            if 'url' in version:
                                                images.append(version['url'])
                                    
                                    if 'video_versions' in carousel_item:
                                        for version in carousel_item['video_versions']:
                                            if 'url' in version:
                                                videos.append(version['url'])
                
                elif isinstance(value, (dict, list)):
                    self._extract_media_from_additional_data(value, images, videos)
    
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
    
    def scrape_brand_instagram_advanced(self, handle: str, brand_name: str) -> dict:
        """Scrape ALL Instagram content for a single brand"""
        logging.info(f"Advanced scraping Instagram for brand: {brand_name} (@{handle})")
        
        # Check if brand folder exists in downloads
        brand_folder = os.path.join('downloads', brand_name)
        if not os.path.exists(brand_folder):
            logging.warning(f"Brand folder not found: {brand_folder}")
            return {
                'brand': brand_name,
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
                'brand': brand_name,
                'handle': handle,
                'success': False,
                'error': 'Failed to fetch page content',
                'images': [],
                'videos': []
            }
        
        # Extract ALL media URLs
        images, videos = self.extract_all_media_urls(html_content)
        
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
            'brand': brand_name,
            'handle': handle,
            'success': True,
            'images': downloaded_images,
            'videos': downloaded_videos,
            'total_images': len(downloaded_images),
            'total_videos': len(downloaded_videos)
        }

def main():
    """Test the advanced scraper with astonecoldstudiosproduction"""
    scraper = InstagramAdvancedScraper()
    
    # Test with the specific brand mentioned
    handle = "astonecoldstudiosproduction"
    brand_name = "A STONECOLD STUDIOS PRODUCTION"
    
    print(f"Testing advanced Instagram scraper with @{handle}")
    print("=" * 60)
    
    result = scraper.scrape_brand_instagram_advanced(handle, brand_name)
    
    print(f"\nResults for {brand_name} (@{handle}):")
    print(f"Success: {result['success']}")
    print(f"Images downloaded: {result['total_images']}")
    print(f"Videos downloaded: {result['total_videos']}")
    
    if result['success']:
        print(f"Content saved to: downloads/{brand_name}/IG/")
    else:
        print(f"Error: {result.get('error', 'Unknown error')}")
    
    return result

if __name__ == "__main__":
    main()

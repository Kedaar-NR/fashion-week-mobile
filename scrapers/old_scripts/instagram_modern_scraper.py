#!/usr/bin/env python3
"""
Modern Instagram Content Scraper
Uses the latest Instagram API endpoints to download ALL posts, images, and videos
Implements advanced techniques to bypass Instagram's anti-scraping measures
"""

import requests
import json
import time
import os
import re
from urllib.parse import urlparse
import logging
from datetime import datetime
import csv

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('instagram_modern_scraper.log'),
        logging.StreamHandler()
    ]
)

class InstagramModernScraper:
    def __init__(self):
        self.session = requests.Session()
        
        # Instagram API endpoints
        self.base_url = "https://www.instagram.com"
        self.api_url = "https://www.instagram.com/api/v1"
        
        # Modern headers that mimic Instagram's latest web app
        self.headers = {
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
        
        # Initialize session
        self._init_session()
    
    def _init_session(self):
        """Initialize the session with proper cookies and tokens"""
        try:
            # First, visit Instagram homepage to get initial cookies
            response = self.session.get(self.base_url, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            # Extract CSRF token from the page
            csrf_match = re.search(r'"csrf_token":"([^"]+)"', response.text)
            if csrf_match:
                self.headers['X-CSRFToken'] = csrf_match.group(1)
            
            # Extract additional tokens
            ig_www_claim_match = re.search(r'"ig_www_claim":"([^"]+)"', response.text)
            if ig_www_claim_match:
                self.headers['X-IG-WWW-Claim'] = ig_www_claim_match.group(1)
            
            logging.info("Session initialized successfully")
            
        except Exception as e:
            logging.warning(f"Failed to initialize session: {e}")
    
    def rate_limit(self):
        """Implement rate limiting"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.request_delay:
            sleep_time = self.request_delay - time_since_last
            time.sleep(sleep_time)
        self.last_request_time = time.time()
    
    def get_user_profile(self, username: str) -> dict:
        """Get user profile information"""
        try:
            self.rate_limit()
            
            # Use the modern web profile info endpoint
            url = f"{self.api_url}/users/web_profile_info/"
            params = {
                'username': username
            }
            
            response = self.session.get(url, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            if 'data' in data and 'user' in data['data']:
                user_data = data['data']['user']
                logging.info(f"Found profile for @{username}: {user_data.get('full_name', 'Unknown')}")
                return user_data
            
        except Exception as e:
            logging.error(f"Failed to get profile for {username}: {e}")
        
        return None
    
    def get_user_feed(self, user_id: str, max_posts: int = 50) -> list:
        """Get user feed using the modern API"""
        posts = []
        
        try:
            self.rate_limit()
            
            # Use the modern feed endpoint
            url = f"{self.api_url}/feed/user/{user_id}/username/{user_id}/"
            params = {
                'count': min(max_posts, 50),
                'max_id': '',
                'min_timestamp': '',
                'rank_token': '',
                'ranked_content': 'true'
            }
            
            response = self.session.get(url, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if 'items' in data:
                for item in data['items']:
                    post_data = {
                        'id': item.get('id'),
                        'shortcode': item.get('code'),
                        'caption': item.get('caption', {}).get('text', '') if item.get('caption') else '',
                        'media_type': item.get('media_type'),
                        'images': [],
                        'videos': [],
                        'timestamp': item.get('taken_at_timestamp'),
                        'likes': item.get('like_count', 0),
                        'comments': item.get('comment_count', 0)
                    }
                    
                    # Extract media URLs based on media type
                    if item.get('media_type') == 1:  # Single image
                        if 'image_versions2' in item:
                            for version in item['image_versions2']['candidates']:
                                post_data['images'].append(version['url'])
                    
                    elif item.get('media_type') == 2:  # Video
                        if 'video_versions' in item:
                            for version in item['video_versions']:
                                post_data['videos'].append(version['url'])
                        if 'image_versions2' in item:  # Video thumbnail
                            for version in item['image_versions2']['candidates']:
                                post_data['images'].append(version['url'])
                    
                    elif item.get('media_type') == 8:  # Carousel
                        if 'carousel_media' in item:
                            for carousel_item in item['carousel_media']:
                                if carousel_item.get('media_type') == 1:  # Image in carousel
                                    if 'image_versions2' in carousel_item:
                                        for version in carousel_item['image_versions2']['candidates']:
                                            post_data['images'].append(version['url'])
                                elif carousel_item.get('media_type') == 2:  # Video in carousel
                                    if 'video_versions' in carousel_item:
                                        for version in carousel_item['video_versions']:
                                            post_data['videos'].append(version['url'])
                    
                    posts.append(post_data)
            
            logging.info(f"Retrieved {len(posts)} posts for user {user_id}")
            
        except Exception as e:
            logging.error(f"Failed to get feed for user {user_id}: {e}")
        
        return posts
    
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
    
    def scrape_brand_instagram_modern(self, handle: str, brand_name: str) -> dict:
        """Scrape ALL Instagram content for a single brand using modern API"""
        logging.info(f"Modern scraping Instagram for brand: {brand_name} (@{handle})")
        
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
        
        # Get user profile
        user_profile = self.get_user_profile(handle)
        if not user_profile:
            return {
                'brand': brand_name,
                'handle': handle,
                'success': False,
                'error': 'Failed to get user profile',
                'images': [],
                'videos': []
            }
        
        user_id = user_profile.get('id')
        
        # Get user feed using modern API
        posts = self.get_user_feed(user_id, max_posts=100)
        
        if not posts:
            return {
                'brand': brand_name,
                'handle': handle,
                'success': False,
                'error': 'No posts found',
                'images': [],
                'videos': []
            }
        
        # Download images and videos
        downloaded_images = []
        downloaded_videos = []
        
        for i, post in enumerate(posts):
            post_dir = os.path.join(ig_folder, f"post_{i+1:03d}")
            os.makedirs(post_dir, exist_ok=True)
            
            # Save post metadata
            metadata_file = os.path.join(post_dir, "metadata.json")
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(post, f, indent=2, ensure_ascii=False)
            
            # Download images
            for j, img_url in enumerate(post['images']):
                file_extension = self.get_file_extension(img_url)
                filename = f"image_{j+1:03d}{file_extension}"
                filepath = os.path.join(post_dir, filename)
                
                if self.download_media(img_url, filepath):
                    downloaded_images.append({
                        'post_id': post['id'],
                        'url': img_url,
                        'filename': filename,
                        'local_path': filepath
                    })
                    logging.info(f"Downloaded image: {filename}")
            
            # Download videos
            for j, video_url in enumerate(post['videos']):
                file_extension = self.get_file_extension(video_url)
                filename = f"video_{j+1:03d}{file_extension}"
                filepath = os.path.join(post_dir, filename)
                
                if self.download_media(video_url, filepath):
                    downloaded_videos.append({
                        'post_id': post['id'],
                        'url': video_url,
                        'filename': filename,
                        'local_path': filepath
                    })
                    logging.info(f"Downloaded video: {filename}")
        
        return {
            'brand': brand_name,
            'handle': handle,
            'user_id': user_id,
            'success': True,
            'posts': posts,
            'images': downloaded_images,
            'videos': downloaded_videos,
            'total_posts': len(posts),
            'total_images': len(downloaded_images),
            'total_videos': len(downloaded_videos)
        }

def main():
    """Test the modern scraper with astonecoldstudiosproduction"""
    scraper = InstagramModernScraper()
    
    # Test with the specific brand mentioned
    handle = "astonecoldstudiosproduction"
    brand_name = "A STONECOLD STUDIOS PRODUCTION"
    
    print(f"Testing modern Instagram scraper with @{handle}")
    print("=" * 60)
    
    result = scraper.scrape_brand_instagram_modern(handle, brand_name)
    
    print(f"\nResults for {brand_name} (@{handle}):")
    print(f"Success: {result['success']}")
    print(f"Posts found: {result.get('total_posts', 0)}")
    print(f"Images downloaded: {result.get('total_images', 0)}")
    print(f"Videos downloaded: {result.get('total_videos', 0)}")
    
    if result['success']:
        print(f"Content saved to: downloads/{brand_name}/IG/")
    else:
        print(f"Error: {result.get('error', 'Unknown error')}")
    
    return result

if __name__ == "__main__":
    main()

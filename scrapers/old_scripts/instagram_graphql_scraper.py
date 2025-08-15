#!/usr/bin/env python3
"""
Instagram GraphQL Scraper
Uses Instagram's GraphQL API to download ALL posts, images, and videos
This is the most effective way to bypass Instagram's anti-scraping measures
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
        logging.FileHandler('instagram_graphql_scraper.log'),
        logging.StreamHandler()
    ]
)

class InstagramGraphQLScraper:
    def __init__(self):
        self.session = requests.Session()
        
        # Instagram GraphQL API endpoints
        self.base_url = "https://www.instagram.com"
        self.graphql_url = "https://www.instagram.com/graphql/query/"
        
        # Headers that mimic Instagram's web app
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'X-Requested-With': 'XMLHttpRequest',
            'X-IG-App-ID': '936619743392459',
            'X-IG-WWW-Claim': '0',
            'X-ASBD-ID': '129477',
            'X-CSRFToken': '',
            'X-Instagram-AJAX': '1',
            'Referer': 'https://www.instagram.com/',
            'Origin': 'https://www.instagram.com'
        }
        
        # Rate limiting
        self.request_delay = 3  # seconds between requests
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
    
    def get_user_id(self, username: str) -> str:
        """Get Instagram user ID from username"""
        try:
            self.rate_limit()
            
            # Use the users/web_profile_info endpoint
            url = f"{self.base_url}/api/v1/users/web_profile_info/"
            params = {
                'username': username
            }
            
            response = self.session.get(url, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            if 'data' in data and 'user' in data['data']:
                user_id = data['data']['user']['id']
                logging.info(f"Found user ID for @{username}: {user_id}")
                return user_id
            
        except Exception as e:
            logging.error(f"Failed to get user ID for {username}: {e}")
        
        return None
    
    def get_user_posts_graphql(self, user_id: str, max_posts: int = 50) -> list:
        """Get user posts using Instagram's GraphQL API"""
        posts = []
        
        try:
            self.rate_limit()
            
            # GraphQL query for user posts
            variables = {
                "id": user_id,
                "first": min(max_posts, 50),
                "after": None
            }
            
            # Instagram's GraphQL query hash for user posts
            query_hash = "003056d32c2554def87228bc3fd9668a"
            
            params = {
                'query_hash': query_hash,
                'variables': json.dumps(variables)
            }
            
            response = self.session.get(self.graphql_url, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if 'data' in data and 'user' in data['data']:
                user_data = data['data']['user']
                if 'edge_owner_to_timeline_media' in user_data:
                    edges = user_data['edge_owner_to_timeline_media']['edges']
                    
                    for edge in edges:
                        node = edge['node']
                        post_data = {
                            'id': node.get('id'),
                            'shortcode': node.get('shortcode'),
                            'caption': node.get('edge_media_to_caption', {}).get('edges', [{}])[0].get('node', {}).get('text', ''),
                            'media_type': node.get('__typename'),
                            'images': [],
                            'videos': [],
                            'timestamp': node.get('taken_at_timestamp'),
                            'likes': node.get('edge_media_preview_like', {}).get('count', 0),
                            'comments': node.get('edge_media_to_comment', {}).get('count', 0)
                        }
                        
                        # Extract media URLs based on media type
                        if node.get('__typename') == 'GraphImage':
                            # Single image
                            if 'display_url' in node:
                                post_data['images'].append(node['display_url'])
                            if 'display_resources' in node:
                                for resource in node['display_resources']:
                                    if 'src' in resource:
                                        post_data['images'].append(resource['src'])
                        
                        elif node.get('__typename') == 'GraphVideo':
                            # Video
                            if 'video_url' in node:
                                post_data['videos'].append(node['video_url'])
                            if 'display_url' in node:
                                post_data['images'].append(node['display_url'])  # Video thumbnail
                        
                        elif node.get('__typename') == 'GraphSidecar':
                            # Carousel (multiple images/videos)
                            if 'edge_sidecar_to_children' in node:
                                for edge_child in node['edge_sidecar_to_children']['edges']:
                                    child_node = edge_child['node']
                                    if child_node.get('__typename') == 'GraphImage':
                                        if 'display_url' in child_node:
                                            post_data['images'].append(child_node['display_url'])
                                    elif child_node.get('__typename') == 'GraphVideo':
                                        if 'video_url' in child_node:
                                            post_data['videos'].append(child_node['video_url'])
                                        if 'display_url' in child_node:
                                            post_data['images'].append(child_node['display_url'])
                        
                        posts.append(post_data)
            
            logging.info(f"Retrieved {len(posts)} posts for user {user_id}")
            
        except Exception as e:
            logging.error(f"Failed to get posts for user {user_id}: {e}")
        
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
    
    def scrape_brand_instagram_graphql(self, handle: str, brand_name: str) -> dict:
        """Scrape ALL Instagram content for a single brand using GraphQL"""
        logging.info(f"GraphQL scraping Instagram for brand: {brand_name} (@{handle})")
        
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
        
        # Get user ID
        user_id = self.get_user_id(handle)
        if not user_id:
            return {
                'brand': brand_name,
                'handle': handle,
                'success': False,
                'error': 'Failed to get user ID',
                'images': [],
                'videos': []
            }
        
        # Get user posts using GraphQL
        posts = self.get_user_posts_graphql(user_id, max_posts=100)
        
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
    """Test the GraphQL scraper with astonecoldstudiosproduction"""
    scraper = InstagramGraphQLScraper()
    
    # Test with the specific brand mentioned
    handle = "astonecoldstudiosproduction"
    brand_name = "A STONECOLD STUDIOS PRODUCTION"
    
    print(f"Testing GraphQL Instagram scraper with @{handle}")
    print("=" * 60)
    
    result = scraper.scrape_brand_instagram_graphql(handle, brand_name)
    
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

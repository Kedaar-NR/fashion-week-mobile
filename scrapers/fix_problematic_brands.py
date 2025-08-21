#!/usr/bin/env python3
"""
Fix Problematic Brands Script
Re-scrapes brands that didn't work and organizes content properly
"""

import requests
import json
import os
import time
import re
from urllib.parse import urlparse
import urllib.request
import logging
import shutil

class FixProblematicBrands:
    def __init__(self, output_dir="downloads/instagram_data"):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Instagram 219.0.0.12.117 Android',
            'Accept': '*/*',
            'Accept-Language': 'en-US',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        })
        self.output_dir = output_dir
        self.setup_logging()
        
    def setup_logging(self):
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def extract_username(self, instagram_url):
        path = urlparse(instagram_url).path
        username = path.strip('/')
        return username if username and not username.startswith('p/') else None
    
    def get_user_info(self, username):
        try:
            url = f"https://i.instagram.com/api/v1/users/web_profile_info/?username={username}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                user = data.get('data', {}).get('user', {})
                
                return {
                    'username': username,
                    'full_name': user.get('full_name', ''),
                    'biography': user.get('biography', ''),
                    'profile_pic_url': user.get('profile_pic_url', ''),
                    'profile_pic_url_hd': user.get('profile_pic_url_hd', ''),
                    'followers': user.get('edge_followed_by', {}).get('count', 0),
                    'posts_count': user.get('edge_owner_to_timeline_media', {}).get('count', 0),
                    'is_private': user.get('is_private', False)
                }
            
            return None
        except Exception as e:
            self.logger.error(f"Error getting user info for {username}: {e}")
            return None
    
    def get_user_posts(self, username, max_posts=6):
        try:
            url = f"https://i.instagram.com/api/v1/feed/user/{username}/username/?count={max_posts}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                posts = data.get('items', [])
                
                posts_data = []
                for post in posts:
                    post_data = {
                        'id': post.get('id', ''),
                        'caption': post.get('caption', {}).get('text', ''),
                        'media_urls': [],
                        'likes': post.get('like_count', 0),
                        'comments': post.get('comment_count', 0)
                    }
                    
                    # Get media URLs
                    if post.get('media_type') == 2:  # Video
                        if post.get('video_versions'):
                            post_data['media_urls'].append({
                                'type': 'video',
                                'url': post['video_versions'][0]['url']
                            })
                    else:  # Image
                        if post.get('image_versions2', {}).get('candidates'):
                            post_data['media_urls'].append({
                                'type': 'image',
                                'url': post['image_versions2']['candidates'][0]['url']
                            })
                    
                    # Handle carousel posts
                    if post.get('carousel_media'):
                        for carousel_item in post['carousel_media']:
                            if carousel_item.get('media_type') == 2:  # Video
                                if carousel_item.get('video_versions'):
                                    post_data['media_urls'].append({
                                        'type': 'video',
                                        'url': carousel_item['video_versions'][0]['url']
                                    })
                            else:  # Image
                                if carousel_item.get('image_versions2', {}).get('candidates'):
                                    post_data['media_urls'].append({
                                        'type': 'image',
                                        'url': carousel_item['image_versions2']['candidates'][0]['url']
                                    })
                    
                    posts_data.append(post_data)
                
                return posts_data
            
            return []
        except Exception as e:
            self.logger.error(f"Error getting posts for {username}: {e}")
            return []
    
    def download_media(self, url, filepath):
        try:
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            urllib.request.urlretrieve(url, filepath)
            self.logger.info(f"Downloaded: {filepath}")
            return True
        except Exception as e:
            self.logger.error(f"Error downloading {url}: {e}")
            return False
    
    def organize_content(self, brand_folder):
        """Organize content by separating JPG and MP4 files"""
        try:
            # Create organized folders
            images_folder = os.path.join(brand_folder, 'images')
            videos_folder = os.path.join(brand_folder, 'videos')
            posts_folder = os.path.join(brand_folder, 'posts')
            
            os.makedirs(images_folder, exist_ok=True)
            os.makedirs(videos_folder, exist_ok=True)
            os.makedirs(posts_folder, exist_ok=True)
            
            # Move profile pictures to images folder
            for file in os.listdir(brand_folder):
                if file.endswith('.jpg') and 'profile' in file:
                    src = os.path.join(brand_folder, file)
                    dst = os.path.join(images_folder, file)
                    shutil.move(src, dst)
                    self.logger.info(f"Moved profile picture: {file}")
            
            # Organize post content
            for item in os.listdir(brand_folder):
                item_path = os.path.join(brand_folder, item)
                if os.path.isdir(item_path) and item.startswith('post_'):
                    # This is a post folder
                    post_images_folder = os.path.join(images_folder, item)
                    post_videos_folder = os.path.join(videos_folder, item)
                    
                    os.makedirs(post_images_folder, exist_ok=True)
                    os.makedirs(post_videos_folder, exist_ok=True)
                    
                    # Move files from post folder to organized folders
                    for file in os.listdir(item_path):
                        if file.endswith('.jpg'):
                            src = os.path.join(item_path, file)
                            dst = os.path.join(post_images_folder, file)
                            shutil.move(src, dst)
                        elif file.endswith('.mp4'):
                            src = os.path.join(item_path, file)
                            dst = os.path.join(post_videos_folder, file)
                            shutil.move(src, dst)
                    
                    # Move post_data.json to posts folder
                    post_data_file = os.path.join(item_path, 'post_data.json')
                    if os.path.exists(post_data_file):
                        dst = os.path.join(posts_folder, f"{item}_data.json")
                        shutil.move(post_data_file, dst)
                    
                    # Remove empty post folder
                    if not os.listdir(item_path):
                        os.rmdir(item_path)
            
            self.logger.info(f"Organized content for {os.path.basename(brand_folder)}")
            
        except Exception as e:
            self.logger.error(f"Error organizing content: {e}")
    
    def scrape_brand(self, brand_name, instagram_url):
        try:
            username = self.extract_username(instagram_url)
            if not username:
                return False
            
            brand_folder = os.path.join(self.output_dir, brand_name)
            
            # Remove existing folder if it exists
            if os.path.exists(brand_folder):
                shutil.rmtree(brand_folder)
            
            os.makedirs(brand_folder, exist_ok=True)
            
            self.logger.info(f"Processing {brand_name} (@{username})")
            
            # Get user info
            user_info = self.get_user_info(username)
            if user_info:
                # Download profile picture
                if user_info.get('profile_pic_url_hd'):
                    profile_path = os.path.join(brand_folder, f"{username}_profile_hd.jpg")
                    self.download_media(user_info['profile_pic_url_hd'], profile_path)
                elif user_info.get('profile_pic_url'):
                    profile_path = os.path.join(brand_folder, f"{username}_profile.jpg")
                    self.download_media(user_info['profile_pic_url'], profile_path)
                
                # Save user info
                with open(os.path.join(brand_folder, 'user_info.json'), 'w') as f:
                    json.dump(user_info, f, indent=2)
            
            # Get posts
            posts = self.get_user_posts(username, max_posts=6)
            
            # Download post media
            downloaded_count = 0
            for i, post in enumerate(posts):
                post_folder = os.path.join(brand_folder, f"post_{i+1}")
                os.makedirs(post_folder, exist_ok=True)
                
                # Save post data
                with open(os.path.join(post_folder, 'post_data.json'), 'w') as f:
                    json.dump(post, f, indent=2)
                
                # Download media
                for j, media in enumerate(post.get('media_urls', [])):
                    if media['type'] == 'image':
                        filename = f"image_{j+1}.jpg"
                    else:
                        filename = f"video_{j+1}.mp4"
                    
                    filepath = os.path.join(post_folder, filename)
                    if self.download_media(media['url'], filepath):
                        downloaded_count += 1
                
                time.sleep(1)
            
            # Organize content
            self.organize_content(brand_folder)
            
            self.logger.info(f"Downloaded {downloaded_count} media files for {brand_name}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error scraping {brand_name}: {e}")
            return False
    
    def run(self):
        """Re-scrape problematic brands"""
        problematic_brands = {
            'BAGJIO': 'https://www.instagram.com/bagjio_/?hl=en',
            'BANISHEDUSA': 'https://www.instagram.com/banishedusa/?hl=en',
            'CHEATIN SNAKES WORLDWIDE': 'https://www.instagram.com/cheatinsnakes/?hl=en',
            'HAVEYOUDIEDBEFORE': 'https://www.instagram.com/haveyoudiedbefore/',
            'HEAVROLET': 'https://www.instagram.com/heavrolet/?hl=en',
            'HUBANE': 'https://www.instagram.com/hubane_/',
            'IDIEDLASTNIGHT': 'https://www.instagram.com/idiedlastnightt/?hl=en',
            'JACKJOHNJR': 'https://www.instagram.com/jackjohnjr/?hl=en',
            'JAXON JET': 'https://www.instagram.com/jaxonjet7/',
            'LOSE RELIGION': 'https://www.instagram.com/lostreligionofficial/?hl=en',
            'LUXENBURG': 'https://www.instagram.com/luxenburg___________/?hl=en',
            'MILES FRANKLIN': 'https://www.instagram.com/milesfrankl1n/',
            'WORSHIP': 'https://www.instagram.com/worship95/',
            'YAMI MIYAZAKI': 'https://www.instagram.com/yami.miyazaki/?hl=en'
        }
        
        self.logger.info("Starting to fix problematic brands...")
        
        successful = 0
        for brand_name, instagram_url in problematic_brands.items():
            if self.scrape_brand(brand_name, instagram_url):
                successful += 1
            time.sleep(3)
        
        self.logger.info(f"Completed! Successfully fixed {successful} out of {len(problematic_brands)} brands")

def main():
    fixer = FixProblematicBrands()
    fixer.run()

if __name__ == "__main__":
    main()

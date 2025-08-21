#!/usr/bin/env python3
"""
Reorganize Final Structure Script
Creates images folder, videos folder, and posts folder for each brand
"""

import os
import shutil
import json
import logging
from pathlib import Path

class ReorganizeFinalStructure:
    def __init__(self, output_dir="downloads/instagram_data"):
        self.output_dir = output_dir
        self.setup_logging()
        
    def setup_logging(self):
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def reorganize_brand(self, brand_folder):
        """Reorganize a single brand's folder structure"""
        brand_path = os.path.join(self.output_dir, brand_folder)
        if not os.path.exists(brand_path):
            return False
            
        self.logger.info(f"Reorganizing {brand_folder}...")
        
        # Create folders
        images_dir = os.path.join(brand_path, "images")
        videos_dir = os.path.join(brand_path, "videos")
        posts_dir = os.path.join(brand_path, "posts")
        
        os.makedirs(images_dir, exist_ok=True)
        os.makedirs(videos_dir, exist_ok=True)
        os.makedirs(posts_dir, exist_ok=True)
        
        # Get all post folders
        post_folders = []
        for item in os.listdir(brand_path):
            item_path = os.path.join(brand_path, item)
            if os.path.isdir(item_path) and item.startswith("post_"):
                post_folders.append(item)
        
        if not post_folders:
            self.logger.info(f"  {brand_folder}: No post folders found")
            return True
        
        # Process each post
        for post_folder in sorted(post_folders):
            self.process_post(brand_path, post_folder, images_dir, videos_dir, posts_dir)
        
        return True
    
    def process_post(self, brand_path, post_folder, images_dir, videos_dir, posts_dir):
        """Process a single post and organize its files"""
        post_path = os.path.join(brand_path, post_folder)
        new_post_dir = os.path.join(posts_dir, post_folder)
        os.makedirs(new_post_dir, exist_ok=True)
        
        # Move all files from post folder to appropriate locations
        for file in os.listdir(post_path):
            file_path = os.path.join(post_path, file)
            if os.path.isfile(file_path):
                if file.endswith(('.jpg', '.jpeg', '.png')):
                    # Move to images folder
                    new_image_path = os.path.join(images_dir, file)
                    if not os.path.exists(new_image_path):
                        shutil.move(file_path, new_image_path)
                        self.logger.info(f"    Moved image: {file}")
                    
                    # Copy to posts folder
                    post_image_path = os.path.join(new_post_dir, file)
                    if not os.path.exists(post_image_path):
                        shutil.copy2(new_image_path, post_image_path)
                        
                elif file.endswith(('.mp4', '.mov', '.avi')):
                    # Move to videos folder
                    new_video_path = os.path.join(videos_dir, file)
                    if not os.path.exists(new_video_path):
                        shutil.move(file_path, new_video_path)
                        self.logger.info(f"    Moved video: {file}")
                    
                    # Copy to posts folder
                    post_video_path = os.path.join(new_post_dir, file)
                    if not os.path.exists(post_video_path):
                        shutil.copy2(new_video_path, post_video_path)
                        
                elif file.endswith('.json'):
                    # Move post_data.json to posts folder
                    post_json_path = os.path.join(new_post_dir, file)
                    if not os.path.exists(post_json_path):
                        shutil.move(file_path, post_json_path)
                        self.logger.info(f"    Moved JSON: {file}")
        
        # Remove empty post folder
        try:
            os.rmdir(post_path)
            self.logger.info(f"    Removed empty directory: {post_path}")
        except OSError:
            pass  # Directory not empty
    
    def run(self):
        """Reorganize all brands"""
        self.logger.info("Starting final structure reorganization...")
        
        if not os.path.exists(self.output_dir):
            self.logger.error(f"Instagram data directory not found: {self.output_dir}")
            return
        
        brand_folders = [f for f in os.listdir(self.output_dir) 
                        if os.path.isdir(os.path.join(self.output_dir, f))]
        
        successful = 0
        for brand_folder in sorted(brand_folders):
            if self.reorganize_brand(brand_folder):
                successful += 1
        
        self.logger.info(f"Completed! Reorganized {successful} brands")

def main():
    reorganizer = ReorganizeFinalStructure()
    reorganizer.run()

if __name__ == "__main__":
    main()

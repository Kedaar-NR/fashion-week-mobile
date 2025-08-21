#!/usr/bin/env python3
"""
Reorganize Post Structure Script
Reorganizes Instagram data so each post folder contains both images and videos together
"""

import os
import shutil
import json
import logging
from pathlib import Path

class ReorganizePostStructure:
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
        
        # Check if images and videos folders exist
        images_dir = os.path.join(brand_path, "images")
        videos_dir = os.path.join(brand_path, "videos")
        
        if not os.path.exists(images_dir) and not os.path.exists(videos_dir):
            self.logger.info(f"  {brand_folder}: No images/videos folders found, skipping")
            return True
            
        # Get all post folders from images directory
        post_folders = []
        if os.path.exists(images_dir):
            for item in os.listdir(images_dir):
                item_path = os.path.join(images_dir, item)
                if os.path.isdir(item_path) and item.startswith("post_"):
                    post_folders.append(item)
        
        # Get all post folders from videos directory
        if os.path.exists(videos_dir):
            for item in os.listdir(videos_dir):
                item_path = os.path.join(videos_dir, item)
                if os.path.isdir(item_path) and item.startswith("post_"):
                    if item not in post_folders:
                        post_folders.append(item)
        
        # Process each post
        for post_folder in sorted(post_folders):
            self.reorganize_post(brand_path, post_folder, images_dir, videos_dir)
        
        # Clean up empty directories
        self.cleanup_empty_dirs(brand_path, images_dir, videos_dir)
        
        return True
    
    def reorganize_post(self, brand_path, post_folder, images_dir, videos_dir):
        """Reorganize a single post to have images and videos together"""
        # Create new post directory directly in brand folder
        new_post_dir = os.path.join(brand_path, post_folder)
        os.makedirs(new_post_dir, exist_ok=True)
        
        # Move images from images/post_X/ to post_X/
        old_images_post_dir = os.path.join(images_dir, post_folder)
        if os.path.exists(old_images_post_dir):
            for file in os.listdir(old_images_post_dir):
                if file.endswith(('.jpg', '.jpeg', '.png')):
                    old_path = os.path.join(old_images_post_dir, file)
                    new_path = os.path.join(new_post_dir, file)
                    if not os.path.exists(new_path):
                        shutil.move(old_path, new_path)
                        self.logger.info(f"    Moved image: {file}")
        
        # Move videos from videos/post_X/ to post_X/
        old_videos_post_dir = os.path.join(videos_dir, post_folder)
        if os.path.exists(old_videos_post_dir):
            for file in os.listdir(old_videos_post_dir):
                if file.endswith(('.mp4', '.mov', '.avi')):
                    old_path = os.path.join(old_videos_post_dir, file)
                    new_path = os.path.join(new_post_dir, file)
                    if not os.path.exists(new_path):
                        shutil.move(old_path, new_path)
                        self.logger.info(f"    Moved video: {file}")
        
        # Move post_data.json if it exists
        for old_dir in [old_images_post_dir, old_videos_post_dir]:
            if os.path.exists(old_dir):
                post_data_file = os.path.join(old_dir, "post_data.json")
                if os.path.exists(post_data_file):
                    new_post_data_file = os.path.join(new_post_dir, "post_data.json")
                    if not os.path.exists(new_post_data_file):
                        shutil.move(post_data_file, new_post_data_file)
                        self.logger.info(f"    Moved post_data.json")
    
    def cleanup_empty_dirs(self, brand_path, images_dir, videos_dir):
        """Clean up empty directories after reorganization"""
        # Remove empty post directories from images and videos folders
        for base_dir in [images_dir, videos_dir]:
            if os.path.exists(base_dir):
                for item in os.listdir(base_dir):
                    item_path = os.path.join(base_dir, item)
                    if os.path.isdir(item_path):
                        try:
                            os.rmdir(item_path)  # Only removes if empty
                            self.logger.info(f"    Removed empty directory: {item_path}")
                        except OSError:
                            pass  # Directory not empty
                
                # Try to remove the images/videos directory if empty
                try:
                    os.rmdir(base_dir)
                    self.logger.info(f"    Removed empty directory: {base_dir}")
                except OSError:
                    pass  # Directory not empty
    
    def run(self):
        """Reorganize all brands"""
        self.logger.info("Starting post structure reorganization...")
        
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
    reorganizer = ReorganizePostStructure()
    reorganizer.run()

if __name__ == "__main__":
    main()

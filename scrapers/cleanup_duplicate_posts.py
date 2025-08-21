#!/usr/bin/env python3
"""
Cleanup Duplicate Posts Script
Removes individual post_X folders that are directly in brand folders
Keeps only the posts/ folder structure
"""

import os
import shutil
import logging
from pathlib import Path

class CleanupDuplicatePosts:
    def __init__(self, output_dir="downloads/instagram_data"):
        self.output_dir = output_dir
        self.setup_logging()
        
    def setup_logging(self):
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def cleanup_brand(self, brand_folder):
        """Clean up a single brand's folder structure"""
        brand_path = os.path.join(self.output_dir, brand_folder)
        if not os.path.exists(brand_path):
            return False
            
        self.logger.info(f"Cleaning up {brand_folder}...")
        
        # Find all post_X folders directly in brand folder
        items_to_remove = []
        for item in os.listdir(brand_path):
            item_path = os.path.join(brand_path, item)
            if os.path.isdir(item_path) and item.startswith("post_"):
                items_to_remove.append(item)
        
        if not items_to_remove:
            self.logger.info(f"  {brand_folder}: No duplicate post folders found")
            return True
        
        # Remove duplicate post folders
        for post_folder in items_to_remove:
            post_path = os.path.join(brand_path, post_folder)
            try:
                shutil.rmtree(post_path)
                self.logger.info(f"    Removed duplicate folder: {post_folder}")
            except Exception as e:
                self.logger.error(f"    Error removing {post_folder}: {e}")
        
        return True
    
    def run(self):
        """Clean up all brands"""
        self.logger.info("Starting cleanup of duplicate post folders...")
        
        if not os.path.exists(self.output_dir):
            self.logger.error(f"Instagram data directory not found: {self.output_dir}")
            return
        
        brand_folders = [f for f in os.listdir(self.output_dir) 
                        if os.path.isdir(os.path.join(self.output_dir, f))]
        
        successful = 0
        for brand_folder in sorted(brand_folders):
            if self.cleanup_brand(brand_folder):
                successful += 1
        
        self.logger.info(f"Completed! Cleaned up {successful} brands")

def main():
    cleanup = CleanupDuplicatePosts()
    cleanup.run()

if __name__ == "__main__":
    main()

#!/usr/bin/env python3

"""
Migration Script: Move scraped content to Supabase Storage

This script migrates all content from local scrapers/downloads directory
to Supabase storage bucket 'brand-content' with the following structure:

brand-content/
├── [BRAND_NAME]/
│   ├── scrolling_brand_media/     (from instagram_data/[brand]/images & videos)
│   └── scrolling_product_media/   (from shop_content/[brand]/[product_folders])

Requirements:
- Python packages: supabase, python-dotenv
- Environment variables for Supabase
- Supabase project with 'brand-content' bucket
"""

import os
import sys
import mimetypes
import time
import unicodedata
import re
import csv
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv('EXPO_PUBLIC_SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('EXPO_PRIVATE_SUPABASE_ANON_KEY')
BUCKET_NAME = 'brand-content'

print(SUPABASE_URL)
print(SUPABASE_ANON_KEY)

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
SCRAPERS_DIR = PROJECT_DIR / 'scrapers' / 'downloads'
INSTAGRAM_DATA_DIR = SCRAPERS_DIR / 'instagram_data'
SHOP_CONTENT_DIR = SCRAPERS_DIR / 'shop_content'

# Supported file extensions
SUPPORTED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.mp4', '.mov', '.webp'}

# Progress tracking
total_files = 0
processed_files = 0
errors = []
failed_uploads = []  # Detailed failure tracking for CSV export

def sanitize_key_component(component: str) -> str:
    """Sanitize a string component for use in Supabase Storage keys.
    
    Removes accents, replaces spaces with underscores, and only allows
    safe characters: letters, numbers, dashes, underscores, dots.
    """
    # Normalize unicode and remove accents
    component = unicodedata.normalize('NFKD', component).encode('ASCII', 'ignore').decode()
    # Replace spaces with underscores
    component = component.replace(" ", "_")
    # Allow only safe characters: letters, numbers, dashes, underscores, dots
    component = re.sub(r"[^A-Za-z0-9._-]", "", component)
    return component

def get_mime_type(file_path: Path) -> str:
    """Get MIME type for a file."""
    mime_type, _ = mimetypes.guess_type(str(file_path))
    if mime_type:
        return mime_type
    
    # Fallback for common extensions
    ext = file_path.suffix.lower()
    mime_map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg', 
        '.png': 'image/png',
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.webp': 'image/webp'
    }
    return mime_map.get(ext, 'application/octet-stream')

def upload_file(supabase: Client, local_path: Path, storage_path: str, retries: int = 3) -> bool:
    """Upload file to Supabase storage with retry logic."""
    global processed_files, failed_uploads
    
    try:
        print(f"📤 Uploading: {storage_path}")
        
        mime_type = get_mime_type(local_path)
        
        # Upload to Supabase using the correct syntax from documentation
        with open(local_path, 'rb') as f:
            response = supabase.storage.from_(BUCKET_NAME).upload(
                file=f,
                path=storage_path,
                file_options={
                    "content-type": mime_type,
                    "upsert": "true"
                }
            )
        
        # Check for errors in response
        if hasattr(response, 'error') and response.error:
            raise Exception(str(response.error))
        
        processed_files += 1
        print(f"✅ Uploaded: {storage_path} ({processed_files}/{total_files})")
        return True
        
    except Exception as error:
        if retries > 0:
            print(f"⚠️  Retrying upload: {storage_path} ({retries} retries left)")
            time.sleep(1)  # Wait 1 second
            return upload_file(supabase, local_path, storage_path, retries - 1)
        
        # Record detailed failure information
        file_size = local_path.stat().st_size if local_path.exists() else 0
        failed_upload = {
            'timestamp': datetime.now().isoformat(),
            'local_path': str(local_path),
            'storage_path': storage_path,
            'file_name': local_path.name,
            'file_size_bytes': file_size,
            'mime_type': get_mime_type(local_path),
            'error_message': str(error),
            'brand_name': storage_path.split('/')[0] if '/' in storage_path else '',
            'media_type': 'brand_media' if 'scrolling_brand_media' in storage_path else 'product_media'
        }
        failed_uploads.append(failed_upload)
        
        error_msg = f"Failed to upload {storage_path}: {str(error)}"
        print(f"❌ {error_msg}")
        errors.append(error_msg)
        return False

def get_media_files(dir_path: Path) -> List[Path]:
    """Get all media files from a directory recursively."""
    if not dir_path.exists():
        return []
    
    files = []
    for item in dir_path.rglob('*'):
        if item.is_file() and item.suffix.lower() in SUPPORTED_EXTENSIONS:
            files.append(item)
    
    return files

def count_total_files() -> int:
    """Count total files to process."""
    print('📊 Counting files to process...')
    
    count = 0
    
    if not INSTAGRAM_DATA_DIR.exists():
        print(f"⚠️  Instagram data directory not found: {INSTAGRAM_DATA_DIR}")
        return count
    
    for brand_dir in INSTAGRAM_DATA_DIR.iterdir():
        if not brand_dir.is_dir():
            continue
        
        brand_name = brand_dir.name
        
        # Count Instagram media files (images and videos directories)
        images_dir = brand_dir / 'images'
        videos_dir = brand_dir / 'videos'
        
        image_files = get_media_files(images_dir)
        video_files = get_media_files(videos_dir)
        count += len(image_files) + len(video_files)
        
        # Count shop content files
        brand_shop_dir = SHOP_CONTENT_DIR / brand_name
        if brand_shop_dir.exists():
            shop_files = get_media_files(brand_shop_dir)
            count += len(shop_files)
    
    return count

def process_instagram_data(supabase: Client, brand_name: str) -> None:
    """Process Instagram data for a brand."""
    print(f"\n🏷️  Processing Instagram data for: {brand_name}")
    
    brand_dir = INSTAGRAM_DATA_DIR / brand_name
    if not brand_dir.exists():
        print(f"⚠️  Instagram data not found for: {brand_name}")
        return
    
    # Sanitize brand name for storage path
    brand_safe = sanitize_key_component(brand_name)
    
    files_processed = 0
    
    # Process images directory
    images_dir = brand_dir / 'images'
    image_files = get_media_files(images_dir)
    
    for file_path in image_files:
        storage_path = f"{brand_safe}/scrolling_brand_media/{file_path.name}"
        if upload_file(supabase, file_path, storage_path):
            files_processed += 1
    
    # Process videos directory  
    videos_dir = brand_dir / 'videos'
    video_files = get_media_files(videos_dir)
    
    for file_path in video_files:
        storage_path = f"{brand_safe}/scrolling_brand_media/{file_path.name}"
        if upload_file(supabase, file_path, storage_path):
            files_processed += 1
    
    total_brand_files = len(image_files) + len(video_files)
    print(f"✅ Completed Instagram data for: {brand_name} ({files_processed}/{total_brand_files} files)")

def process_shop_content(supabase: Client, brand_name: str) -> None:
    """Process shop content for a brand."""
    print(f"\n🛍️  Processing shop content for: {brand_name}")
    
    brand_shop_dir = SHOP_CONTENT_DIR / brand_name
    if not brand_shop_dir.exists():
        print(f"⚠️  Shop content not found for: {brand_name}")
        return
    
    # Sanitize brand name for storage path
    brand_safe = sanitize_key_component(brand_name)
    
    files_processed = 0
    total_product_files = 0
    
    # Get all product folders
    for product_dir in brand_shop_dir.iterdir():
        if not product_dir.is_dir():
            continue
        
        # Sanitize product name for storage path
        product_safe = sanitize_key_component(product_dir.name)
        
        product_files = get_media_files(product_dir)
        total_product_files += len(product_files)
        
        for file_path in product_files:
            # Maintain product folder structure in storage with sanitized names
            storage_path = f"{brand_safe}/scrolling_product_media/{product_safe}/{file_path.name}"
            if upload_file(supabase, file_path, storage_path):
                files_processed += 1
    
    print(f"✅ Completed shop content for: {brand_name} ({files_processed}/{total_product_files} files)")

def verify_bucket(supabase: Client) -> bool:
    """Verify bucket exists and is accessible."""
    print(f"🔍 Verifying bucket: {BUCKET_NAME}")
    
    try:
        result = supabase.storage.get_bucket(BUCKET_NAME)
        
        if hasattr(result, 'error') and result.error:
            print(f"❌ Error accessing bucket: {result.error.message}")
            return False
        
        print(f"✅ Bucket verified: {BUCKET_NAME}")
        return True
        
    except Exception as error:
        print(f"❌ Failed to verify bucket: {str(error)}")
        return False

def export_failed_uploads_csv() -> None:
    """Export failed uploads to CSV file in scripts folder."""
    if not failed_uploads:
        print("📊 No failed uploads to export.")
        return
    
    # Create CSV filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_filename = f"failed_uploads_{timestamp}.csv"
    csv_path = SCRIPT_DIR / csv_filename
    
    try:
        with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = [
                'timestamp',
                'brand_name', 
                'media_type',
                'file_name',
                'local_path',
                'storage_path',
                'file_size_bytes',
                'mime_type',
                'error_message'
            ]
            
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for failure in failed_uploads:
                writer.writerow(failure)
        
        print(f"📊 Exported {len(failed_uploads)} failed uploads to: {csv_path}")
        
    except Exception as error:
        print(f"❌ Failed to export CSV: {str(error)}")

def generate_report() -> None:
    """Generate progress report."""
    print('\n📋 MIGRATION REPORT')
    print('=' * 50)
    print(f"Total files processed: {processed_files}/{total_files}")
    
    if total_files > 0:
        success_rate = (processed_files / total_files) * 100
        print(f"Success rate: {success_rate:.2f}%")
    else:
        print("Success rate: 0%")
    
    print(f"Errors: {len(errors)}")
    
    if errors:
        print('\n❌ ERRORS:')
        for i, error in enumerate(errors, 1):
            print(f"{i}. {error}")
    
    # Export failed uploads to CSV
    export_failed_uploads_csv()
    
    print('\n✅ Migration completed!')

def main():
    """Main migration function."""
    global total_files
    
    print('🚀 Starting Supabase Storage Migration')
    print('=' * 50)
    
    # Verify environment
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        print('❌ Missing Supabase environment variables')
        print('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY')
        sys.exit(1)
    
    # Verify directories exist
    if not INSTAGRAM_DATA_DIR.exists():
        print(f"❌ Instagram data directory not found: {INSTAGRAM_DATA_DIR}")
        sys.exit(1)
    
    if not SHOP_CONTENT_DIR.exists():
        print(f"❌ Shop content directory not found: {SHOP_CONTENT_DIR}")
        sys.exit(1)
    
    # Initialize Supabase client
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    except Exception as error:
        print(f"❌ Failed to initialize Supabase client: {str(error)}")
        sys.exit(1)
    
    # Verify bucket
    if not verify_bucket(supabase):
        print('❌ Cannot access Supabase storage bucket')
        sys.exit(1)
    
    # Count total files
    total_files = count_total_files()
    print(f"📊 Total files to process: {total_files}")
    
    if total_files == 0:
        print('⚠️  No files found to migrate')
        return
    
    # Get all brand folders from Instagram data
    brand_names = [
        item.name for item in INSTAGRAM_DATA_DIR.iterdir() 
        if item.is_dir()
    ]
    
    print(f"📦 Found {len(brand_names)} brands to process")
    
    # Process each brand
    for brand_name in brand_names:
        try:
            print(f"\n🏢 Processing brand: {brand_name}")
            
            # Process Instagram data (scrolling_brand_media)
            process_instagram_data(supabase, brand_name)
            
            # Process shop content (scrolling_product_media)
            process_shop_content(supabase, brand_name)
            
        except Exception as error:
            error_msg = f"Failed to process brand {brand_name}: {str(error)}"
            print(f"❌ {error_msg}")
            errors.append(error_msg)
    
    # Generate final report
    generate_report()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print('\n⚠️  Migration interrupted by user')
        generate_report()
        sys.exit(0)
    except Exception as error:
        print(f'❌ Migration failed: {str(error)}')
        generate_report()
        sys.exit(1)

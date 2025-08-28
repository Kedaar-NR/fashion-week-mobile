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
import argparse
import json
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
skipped_files = 0
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

def resolve_folder_name(suspect_name: str, base_dir: Path) -> Optional[str]:
    """Resolve a possibly-sanitized brand name to the actual on-disk folder name under base_dir.
    
    Tries, in order:
    - Exact match
    - Case-insensitive match
    - Sanitized-name match (using sanitize_key_component)
    Returns the real folder name if found, otherwise None.
    """
    try:
        if not base_dir.exists() or not base_dir.is_dir():
            return None
        # Exact match
        exact_path = base_dir / suspect_name
        if exact_path.exists() and exact_path.is_dir():
            return suspect_name
        suspect_lower = suspect_name.lower()
        suspect_sanitized = sanitize_key_component(suspect_name).lower()
        # Case-insensitive match
        for item in base_dir.iterdir():
            if item.is_dir() and item.name.lower() == suspect_lower:
                return item.name
        # Sanitized-name match
        for item in base_dir.iterdir():
            if not item.is_dir():
                continue
            if sanitize_key_component(item.name).lower() == suspect_sanitized:
                return item.name
    except Exception:
        return None
    return None

def load_brands_from_file(path: str) -> List[str]:
    """Load brand names from a file supporting JSON array or newline/comma-separated lists."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            # Try JSON array first
            try:
                data = json.loads(content)
                if isinstance(data, list):
                    return [str(x).strip() for x in data if str(x).strip()]
            except Exception:
                pass
            # Fallback: newline or comma separated
            parts = [p.strip() for p in re.split(r"[\n,]", content) if p.strip()]
            return parts
    except Exception as e:
        print(f"❌ Failed to read brands file {path}: {e}")
        return []

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

def storage_file_exists(supabase: Client, storage_path: str) -> bool:
    """Check if a file already exists at storage_path in the bucket."""
    try:
        parent = str(Path(storage_path).parent)
        filename = Path(storage_path).name
        list_path = '' if parent == '.' else parent
        result = supabase.storage.from_(BUCKET_NAME).list(list_path)
        if not result:
            return False
        for item in result:
            if isinstance(item, dict) and item.get('name') == filename:
                return True
        return False
    except Exception:
        # If unsure, assume it does not exist to proceed with upload
        return False

def upload_file(supabase: Client, local_path: Path, storage_path: str, retries: int = 3) -> bool:
    """Upload file to Supabase storage with retry logic. Skips if already exists."""
    global processed_files, skipped_files, failed_uploads
    
    try:
        # Skip upload if the file already exists to prevent duplicates
        if storage_file_exists(supabase, storage_path):
            skipped_files += 1
            print(f"⏭️  Skipping (exists): {storage_path}")
            return True

        print(f"📤 Uploading: {storage_path}")
        
        mime_type = get_mime_type(local_path)
        
        # Upload to Supabase using the correct syntax from documentation
        with open(local_path, 'rb') as f:
            response = supabase.storage.from_(BUCKET_NAME).upload(
                file=f,
                path=storage_path,
                file_options={
                    "content-type": mime_type
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

def count_total_files(brand_names: List[str]) -> int:
    """Count total files to process across both sources for provided brands."""
    print('📊 Counting files to process...')
    
    count = 0
    
    for brand_name in brand_names:
        # Resolve Instagram folder
        ig_resolved = resolve_folder_name(brand_name, INSTAGRAM_DATA_DIR)
        if ig_resolved:
            brand_dir = INSTAGRAM_DATA_DIR / ig_resolved
            images_dir = brand_dir / 'images'
            videos_dir = brand_dir / 'videos'
            image_files = get_media_files(images_dir)
            video_files = get_media_files(videos_dir)
            count += len(image_files) + len(video_files)
        
        # Resolve Shop content folder
        shop_resolved = resolve_folder_name(brand_name, SHOP_CONTENT_DIR)
        if shop_resolved:
            brand_shop_dir = SHOP_CONTENT_DIR / shop_resolved
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
    print(f"Total files considered: {total_files}")
    print(f"- Uploaded: {processed_files}")
    print(f"- Skipped (already existed): {skipped_files}")
    
    if total_files > 0:
        completed = processed_files + skipped_files
        success_rate = (completed / total_files) * 100
        print(f"Completion rate (uploaded or skipped): {success_rate:.2f}%")
    else:
        print("Completion rate: 0%")
    
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
    
    # Verify directories exist (warn but do not exit to allow processing from whichever exists)
    if not INSTAGRAM_DATA_DIR.exists():
        print(f"⚠️  Instagram data directory not found: {INSTAGRAM_DATA_DIR}")
    
    if not SHOP_CONTENT_DIR.exists():
        print(f"⚠️  Shop content directory not found: {SHOP_CONTENT_DIR}")
    
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
    
    # CLI arguments to optionally scope brands
    parser = argparse.ArgumentParser(description="Migrate scraped content to Supabase Storage")
    parser.add_argument(
        "--brands-file",
        dest="brands_file",
        type=str,
        default=None,
        help="Path to a file containing brand names (JSON array or newline/comma separated)",
    )
    parser.add_argument(
        "--brands",
        dest="brands",
        type=str,
        default=None,
        help="Comma-separated list of brand names",
    )
    args = parser.parse_args()

    # Build union of brand names from both sources, optionally restricted by CLI args
    instagram_brands = set()
    shop_content_brands = set()
    if INSTAGRAM_DATA_DIR.exists():
        instagram_brands = {item.name for item in INSTAGRAM_DATA_DIR.iterdir() if item.is_dir()}
    if SHOP_CONTENT_DIR.exists():
        shop_content_brands = {item.name for item in SHOP_CONTENT_DIR.iterdir() if item.is_dir()}

    discovered_brands = sorted(instagram_brands.union(shop_content_brands))

    brand_names: List[str] = []
    if args.brands_file:
        brand_names = load_brands_from_file(args.brands_file)
        print(f"📋 Loaded {len(brand_names)} brands from file: {args.brands_file}")
    elif args.brands:
        brand_names = [b.strip() for b in args.brands.split(',') if b.strip()]
        print(f"📋 Loaded {len(brand_names)} brands from --brands argument")
    else:
        brand_names = discovered_brands
        print(f"📋 Using discovered brands from sources")
    
    print("BRAND NAMES: ", brand_names)
    
    # Count total files across the selected set
    total_files = count_total_files(brand_names)
    print(f"📊 Total files to process: {total_files}")
    
    if total_files == 0:
        print('⚠️  No files found to migrate')
        return
    
    print(f"📦 Found {len(brand_names)} brands to process (union of sources)")
    

    # Process each brand
    for brand_name in brand_names:
        try:
            ig_resolved = resolve_folder_name(brand_name, INSTAGRAM_DATA_DIR)
            shop_resolved = resolve_folder_name(brand_name, SHOP_CONTENT_DIR)

            print(f"\n🏢 Processing brand: {brand_name}")
            print(f"INSTAGRAM_DATA_DIR requested: {INSTAGRAM_DATA_DIR / brand_name}")
            print(f"INSTAGRAM_DATA_DIR resolved:  {INSTAGRAM_DATA_DIR / ig_resolved if ig_resolved else 'None'}")
            print(f"SHOP_CONTENT_DIR requested:  {SHOP_CONTENT_DIR / brand_name}")
            print(f"SHOP_CONTENT_DIR resolved:   {SHOP_CONTENT_DIR / shop_resolved if shop_resolved else 'None'}")

            # Process Instagram data (scrolling_brand_media) only if source exists
            if ig_resolved:
                process_instagram_data(supabase, ig_resolved)
            else:
                print(f"ℹ️  No Instagram data for: {brand_name} (skipping brand media)")
            
            # Process shop content (scrolling_product_media) only if source exists
            if shop_resolved:
                process_shop_content(supabase, shop_resolved)
            else:
                print(f"ℹ️  No shop content for: {brand_name} (skipping product media)")
            
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

#!/usr/bin/env python3

"""
Generate index.json files for Supabase Storage brand content

This script generates index.json files for each brand's media folders in Supabase storage:
- One index.json for each brand's scrolling_brand_media folder
- One index.json for each product folder within each brand's scrolling_product_media folder

The index.json files contain a list of media files that the React Native app
can use to load and display brand content.

Requirements:
- Python packages: supabase, python-dotenv
- Environment variables for Supabase
- Supabase project with 'brand-content' bucket
"""

import os
import sys
import json
import time
import unicodedata
import re
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Set
import argparse
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv('EXPO_PUBLIC_SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('EXPO_PRIVATE_SUPABASE_ANON_KEY')
BUCKET_NAME = 'brand-content'

# Supported file extensions for media
SUPPORTED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov'}

# Progress tracking
processed_brands = 0
processed_products = 0
errors = []
processed_brand_names = []  # Track all brand names that were processed

def sanitize_key_component(component: str) -> str:
    """
    Sanitize a path component for safe storage key usage.
    """
    # Normalize unicode
    normalized = unicodedata.normalize('NFKD', component)
    
    # Remove or replace problematic characters
    # Keep alphanumeric, hyphens, underscores, dots, and spaces
    safe = re.sub(r'[^\w\s\-\.]', '', normalized)
    
    # Replace multiple spaces/underscores with single underscore
    safe = re.sub(r'[\s_]+', '_', safe)
    
    # Remove leading/trailing underscores and dots
    safe = safe.strip('_.')
    
    return safe

def list_files_in_storage_folder(supabase: Client, folder_path: str) -> List[str]:
    """
    List all files in a specific storage folder.
    """
    try:
        # Use the storage API to list files
        result = supabase.storage.from_(BUCKET_NAME).list(folder_path)
        
        if not result:
            return []
        
        # Filter for media files only
        media_files = []
        for item in result:
            if isinstance(item, dict) and 'name' in item:
                file_name = item['name']
                # Check if it's a file (not a folder) and has supported extension
                if '.' in file_name:
                    extension = Path(file_name).suffix.lower()
                    if extension in SUPPORTED_EXTENSIONS:
                        media_files.append(file_name)
        
        return sorted(media_files)
        
    except Exception as error:
        print(f"❌ Error listing files in {folder_path}: {str(error)}")
        return []

def create_index_file(supabase: Client, folder_path: str, files: List[str]) -> bool:
    """
    Create an index.json file in the specified folder with the list of files.
    """
    try:
        # Create index.json content
        index_content = {
            "files": files,
            "generated_at": datetime.now().isoformat(),
            "total_files": len(files)
        }
        
        # Convert to JSON string
        json_content = json.dumps(index_content, indent=2)
        json_bytes = json_content.encode('utf-8')
        
        # Upload index.json to storage
        index_path = f"{folder_path}/index.json"
        
        # Try to upload, if it exists we'll need to update it
        try:
            result = supabase.storage.from_(BUCKET_NAME).upload(
                index_path,
                json_bytes,
                file_options={"content-type": "application/json"}
            )
        except Exception as upload_error:
            # If file exists, try to update it instead
            if "already exists" in str(upload_error).lower() or "duplicate" in str(upload_error).lower():
                result = supabase.storage.from_(BUCKET_NAME).update(
                    index_path,
                    json_bytes,
                    file_options={"content-type": "application/json"}
                )
            else:
                raise upload_error
        
        if result:
            print(f"✅ Created index.json for {folder_path} ({len(files)} files)")
            return True
        else:
            print(f"❌ Failed to create index.json for {folder_path}")
            return False
            
    except Exception as error:
        error_msg = f"Failed to create index.json for {folder_path}: {str(error)}"
        print(f"❌ {error_msg}")
        errors.append(error_msg)
        return False

def get_all_brand_folders(supabase: Client) -> List[str]:
    """
    Get all brand folders from storage.
    """
    try:
        # List items in the bucket root (brand folders are directly in bucket)
        result = supabase.storage.from_(BUCKET_NAME).list('', {
            'limit': 1000,
            'offset': 0,
            'sortBy': { 'column': 'name', 'order': 'asc' },
        })
        
        if not result:
            return []
        
        brand_folders: List[str] = []
        for item in result:
            if isinstance(item, dict) and 'name' in item and item['name']:
                # Be permissive: many brand names contain dots/underscores/numbers/mixed case
                # We assume items at root are brand folders in this bucket layout
                brand_folders.append(item['name'])
        
        return sorted(brand_folders)
        
    except Exception as error:
        print(f"❌ Error listing brand folders: {str(error)}")
        return []

def get_product_folders(supabase: Client, brand_name: str) -> List[str]:
    """
    Get all product folders for a specific brand.
    """
    try:
        product_media_path = f"{brand_name}/scrolling_product_media"
        result = supabase.storage.from_(BUCKET_NAME).list(product_media_path)
        
        if not result:
            return []
        
        product_folders = []
        for item in result:
            if isinstance(item, dict) and 'name' in item:
                # Check if it's a folder (no extension)
                if '.' not in item['name']:
                    product_folders.append(item['name'])
        
        return sorted(product_folders)
        
    except Exception as error:
        print(f"❌ Error listing product folders for {brand_name}: {str(error)}")
        return []

def process_brand_media(supabase: Client, brand_name: str) -> bool:
    """
    Process brand media folder and create index.json inside scrolling_brand_media.
    """
    print(f"\n📁 Processing brand media for: {brand_name}")
    
    brand_media_path = f"{brand_name}/scrolling_brand_media"
    
    # Get all media files in the brand media folder
    files = list_files_in_storage_folder(supabase, brand_media_path)
    
    if not files:
        # Still create an empty index.json so the app can fetch a valid structure
        print(f"ℹ️  No media files in {brand_media_path} — creating empty index.json")
        success = create_index_file(supabase, brand_media_path, [])
    else:
        # Create index.json file inside the scrolling_brand_media folder
        success = create_index_file(supabase, brand_media_path, files)
    return success

def process_product_media(supabase: Client, brand_name: str) -> int:
    """
    Process all product media folders for a brand and create index.json files.
    Returns the number of successfully processed products.
    """
    print(f"\n🛍️  Processing product media for: {brand_name}")
    
    # Get all product folders
    product_folders = get_product_folders(supabase, brand_name)
    
    if not product_folders:
        print(f"⚠️  No product folders found for {brand_name}")
        return 0
    
    successful_products = 0
    
    for product_name in product_folders:
        product_media_path = f"{brand_name}/scrolling_product_media/{product_name}"
        
        # Get all media files in this product folder
        files = list_files_in_storage_folder(supabase, product_media_path)
        
        if not files:
            # Create an empty index.json to keep app fetches happy
            print(f"ℹ️  No media files in {product_media_path} — creating empty index.json")
            if create_index_file(supabase, product_media_path, []):
                successful_products += 1
            continue
        
        # Create index.json file for this product
        if create_index_file(supabase, product_media_path, files):
            successful_products += 1
    
    print(f"✅ Processed {successful_products}/{len(product_folders)} products for {brand_name}")
    return successful_products

def verify_bucket(supabase: Client) -> bool:
    """
    Verify that the storage bucket exists and is accessible.
    """
    try:
        # Try to list the root of the bucket
        result = supabase.storage.from_(BUCKET_NAME).list()
        return result is not None
    except Exception as error:
        print(f"❌ Bucket verification failed: {str(error)}")
        return False

def generate_report() -> None:
    """
    Generate a final report of the index file generation process.
    """
    print('\n' + '='*50)
    print('📋 INDEX GENERATION REPORT')
    print('='*50)
    print(f"✅ Brands processed: {processed_brands}")
    print(f"✅ Products processed: {processed_products}")
    
    if processed_brand_names:
        total_brands_attempted = len(processed_brand_names)
        print(f"\n📊 Brand Processing Summary:")
        print(f"   • Total brands attempted: {total_brands_attempted}")
        print(f"   • Successfully processed: {processed_brands}")
        print(f"   • Failed to process: {total_brands_attempted - processed_brands}")
        print(f"\n🏢 Brands processed:")
        print(f"[{', '.join(f'"{brand_name}"' for brand_name in processed_brand_names)}]")
    
    if errors:
        print(f"\n❌ Errors encountered: {len(errors)}")
        for error in errors[:10]:  # Show first 10 errors
            print(f"   • {error}")
        if len(errors) > 10:
            print(f"   ... and {len(errors) - 10} more errors")
    else:
        print("\n🎉 No errors encountered!")
    
    print('\n✅ Index file generation completed!')

def load_brands_from_file(path: str) -> List[str]:
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


def main():
    """
    Main function to generate all index.json files.
    """
    global processed_brands, processed_products
    
    print('🚀 Starting Index File Generation')
    print('=' * 50)
    
    # CLI arguments
    parser = argparse.ArgumentParser(description="Generate index.json files for brand content")
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

    # Verify environment
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        print('❌ Missing Supabase environment variables')
        print('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PRIVATE_SUPABASE_ANON_KEY')
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
    
    # Determine brand list
    brand_folders: List[str] = []
    if args.brands_file:
        brand_folders = load_brands_from_file(args.brands_file)
        print(f"📋 Loaded {len(brand_folders)} brands from file: {args.brands_file}")
    elif args.brands:
        brand_folders = [b.strip() for b in args.brands.split(',') if b.strip()]
        print(f"📋 Loaded {len(brand_folders)} brands from --brands argument")
    else:
        brand_folders = get_all_brand_folders(supabase)
    
    
    if not brand_folders:
        print('⚠️  No brand folders found in storage')
        return
    
    print(f"📦 Found {len(brand_folders)} brands to process")
    
    # Process each brand
    for brand_name in brand_folders:
        try:
            print(f"\n🏢 Processing brand: {brand_name}")
            
            # Process brand media (scrolling_brand_media)
            brand_success = process_brand_media(supabase, brand_name)
            
            # Process product media (scrolling_product_media)
            products_processed = process_product_media(supabase, brand_name)
            processed_products += products_processed
            
            if brand_success:
                processed_brands += 1
                
            # Track all brands that were attempted, regardless of success
            processed_brand_names.append(brand_name)
                
        except Exception as error:
            error_msg = f"Failed to process brand {brand_name}: {str(error)}"
            print(f"❌ {error_msg}")
            errors.append(error_msg)
            # Still track failed brands
            processed_brand_names.append(brand_name)
    
    # Generate final report
    generate_report()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print('\n⚠️  Index generation interrupted by user')
        generate_report()
        sys.exit(0)
    except Exception as error:
        print(f'❌ Index generation failed: {str(error)}')
        generate_report()
        sys.exit(1)

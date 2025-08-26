#!/usr/bin/env python3

"""
Product Table Population Script

This script fills the product table in Supabase with data from scraped content.
It reads product folders from scrapers/downloads/shop_content and creates product
records with the following mappings:

- product_name: Name of product folder
- product_desc: NULL (as requested)
- media_filepath: [sanitized-brand-name]/scrolling_product_media/[sanitized-product-name]
- brand_id: ID from brand table matching folder brand name
- price: NULL (as requested)
- type: NULL (as requested)
- color: NULL (as requested)

Requirements:
- Python packages: supabase, python-dotenv
- Environment variables for Supabase
- Brand table must be populated first
"""

import os
import sys
import unicodedata
import re
from pathlib import Path
from typing import List, Dict, Optional
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv('EXPO_PUBLIC_SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('EXPO_PUBLIC_SUPABASE_ANON_KEY')

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
SHOP_CONTENT_DIR = PROJECT_DIR / 'scrapers' / 'downloads' / 'shop_content'

# Progress tracking
total_products = 0
processed_products = 0
errors = []

def sanitize_key_component(component: str) -> str:
    """Sanitize a string component for use in Supabase Storage keys.
    
    This function is copied from migrate_to_supabase_storage.py to ensure
    the same sanitization logic is used for media_filepath.
    
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

def get_brand_mapping(supabase: Client) -> Dict[str, int]:
    """Get mapping of brand names to brand IDs from the brand table."""
    print("🔍 Fetching brand mapping from database...")
    
    try:
        response = supabase.table("brand").select("id, brand_name").execute()
        
        if not response.data:
            print("❌ No brands found in database")
            return {}
        
        # Create mapping of brand_name to brand_id
        brand_mapping = {}
        for brand in response.data:
            brand_mapping[brand['brand_name']] = brand['id']
        
        print(f"✅ Found {len(brand_mapping)} brands in database")
        return brand_mapping
        
    except Exception as error:
        print(f"❌ Failed to fetch brand mapping: {str(error)}")
        return {}

def get_product_folders() -> Dict[str, List[str]]:
    """Get all product folders organized by brand."""
    print("📂 Scanning product folders...")
    
    if not SHOP_CONTENT_DIR.exists():
        print(f"❌ Shop content directory not found: {SHOP_CONTENT_DIR}")
        return {}
    
    products_by_brand = {}
    
    for brand_dir in SHOP_CONTENT_DIR.iterdir():
        if not brand_dir.is_dir():
            continue
        
        brand_name = brand_dir.name
        product_folders = []
        
        for product_dir in brand_dir.iterdir():
            if product_dir.is_dir():
                product_folders.append(product_dir.name)
        
        if product_folders:
            products_by_brand[brand_name] = product_folders
    
    total_brands = len(products_by_brand)
    total_products = sum(len(products) for products in products_by_brand.values())
    
    print(f"📊 Found {total_products} products across {total_brands} brands")
    return products_by_brand

def create_product_records(products_by_brand: Dict[str, List[str]], brand_mapping: Dict[str, int]) -> List[Dict]:
    """Create product records for database insertion."""
    print("🏗️  Creating product records...")
    
    product_records = []
    skipped_brands = []
    
    for brand_name, product_names in products_by_brand.items():
        # Get brand_id from mapping
        brand_id = brand_mapping.get(brand_name)
        
        if not brand_id:
            print(f"⚠️  Brand not found in database: {brand_name}")
            skipped_brands.append(brand_name)
            continue
        
        print(f"📦 Processing {len(product_names)} products for brand: {brand_name}")
        
        for product_name in product_names:
            # Create sanitized media_filepath with brand/scrolling_product_media/product structure
            sanitized_brand_name = sanitize_key_component(brand_name)
            sanitized_product_name = sanitize_key_component(product_name)
            media_filepath = f"{sanitized_brand_name}/scrolling_product_media/{sanitized_product_name}"
            
            product_record = {
                "product_name": product_name,
                "product_desc": None,  # NULL as requested
                "media_filepath": media_filepath,
                "brand_id": brand_id,
                "price": None,  # NULL as requested
                "type": None,   # NULL as requested
                "color": None   # NULL as requested
            }
            
            product_records.append(product_record)
    
    if skipped_brands:
        print(f"⚠️  Skipped {len(skipped_brands)} brands not found in database:")
        for brand in skipped_brands[:10]:  # Show first 10
            print(f"   - {brand}")
        if len(skipped_brands) > 10:
            print(f"   ... and {len(skipped_brands) - 10} more")
    
    print(f"✅ Created {len(product_records)} product records")
    return product_records

def insert_products(supabase: Client, product_records: List[Dict]) -> bool:
    """Insert product records into the database."""
    print(f"📤 Inserting {len(product_records)} products into database...")
    
    if not product_records:
        print("⚠️  No product records to insert")
        return True
    
    try:
        # Insert in batches to avoid potential size limits
        batch_size = 100
        total_batches = (len(product_records) + batch_size - 1) // batch_size
        
        for i in range(0, len(product_records), batch_size):
            batch = product_records[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            
            print(f"📤 Inserting batch {batch_num}/{total_batches} ({len(batch)} products)...")
            
            response = supabase.table("product").insert(batch).execute()
            
            if hasattr(response, 'error') and response.error:
                raise Exception(str(response.error))
        
        print(f"✅ Successfully inserted all {len(product_records)} products!")
        return True
        
    except Exception as error:
        error_msg = f"Failed to insert products: {str(error)}"
        print(f"❌ {error_msg}")
        errors.append(error_msg)
        return False

def generate_report() -> None:
    """Generate final report."""
    print('\n📋 PRODUCT TABLE POPULATION REPORT')
    print('=' * 50)
    print(f"Total products processed: {processed_products}")
    
    if errors:
        print(f"Errors: {len(errors)}")
        print('\n❌ ERRORS:')
        for i, error in enumerate(errors, 1):
            print(f"{i}. {error}")
    else:
        print("✅ No errors occurred")
    
    print('\n✅ Product table population completed!')

def main():
    """Main function to populate the product table."""
    global total_products, processed_products
    
    print('🚀 Starting Product Table Population')
    print('=' * 50)
    
    # Verify environment
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        print('❌ Missing Supabase environment variables')
        print('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY')
        sys.exit(1)
    
    # Verify directories exist
    if not SHOP_CONTENT_DIR.exists():
        print(f"❌ Shop content directory not found: {SHOP_CONTENT_DIR}")
        sys.exit(1)
    
    # Initialize Supabase client
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        print("✅ Supabase client initialized")
    except Exception as error:
        print(f"❌ Failed to initialize Supabase client: {str(error)}")
        sys.exit(1)
    
    # Get brand mapping from database
    brand_mapping = get_brand_mapping(supabase)
    if not brand_mapping:
        print("❌ No brands found in database. Please run fill_brand_table.py first.")
        sys.exit(1)
    
    # Get product folders from filesystem
    products_by_brand = get_product_folders()
    if not products_by_brand:
        print("❌ No product folders found.")
        sys.exit(1)
    
    # Update total count
    total_products = sum(len(products) for products in products_by_brand.values())
    
    # Create product records
    product_records = create_product_records(products_by_brand, brand_mapping)
    
    # Insert products into database
    if insert_products(supabase, product_records):
        processed_products = len(product_records)
    
    # Generate final report
    generate_report()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print('\n⚠️  Script interrupted by user')
        generate_report()
        sys.exit(0)
    except Exception as error:
        print(f'❌ Script failed: {str(error)}')
        generate_report()
        sys.exit(1)

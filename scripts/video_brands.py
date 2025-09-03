import os
from supabase import create_client, Client
from typing import List

def get_brands_with_videos() -> List[str]:
    """
    Returns a list of brand names that have MP4 files in their scrolling_brand_media folder.
    
    Returns:
        List[str]: List of brand names with MP4 files
    """
    # Initialize Supabase client
    url = "https://bslylabiiircssqasmcs.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzbHlsYWJpaWlyY3NzcWFzbWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MTUyODIsImV4cCI6MjA2Mzk5MTI4Mn0.oKh0kFS-0CjgFsuznTLXrcXIPfDS1-FsXMuBKjBSCHg"
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set")
    
    supabase: Client = create_client(url, key)
    
    brands_with_videos = []
    
    try:
        # List all buckets to find the storage bucket
        buckets = supabase.storage.list_buckets()
        
        # Find the brand-content bucket
        storage_bucket = None
        for bucket in buckets:
            if bucket.name == 'brand-content':
                storage_bucket = bucket.name
                break
        
        if not storage_bucket:
            # If no obvious bucket name, try the first one
            storage_bucket = buckets[0].name if buckets else None
            
        if not storage_bucket:
            raise ValueError("No storage bucket found")
        
        # List all folders in the storage bucket
        folders = supabase.storage.from_(storage_bucket).list()
        
        # Go through each folder (brand)
        for folder in folders:
            if folder.get('name') and not folder.get('name').startswith('.'):
                brand_name = folder['name']
                
                # Check if this brand has a scrolling_brand_media folder
                try:
                    media_files = supabase.storage.from_(storage_bucket).list(
                        path=f"{brand_name}/scrolling_brand_media"
                    )
                    
                    # Check if any files in the folder are MP4s
                    has_mp4 = any(
                        file.get('name', '').lower().endswith('.mp4') 
                        for file in media_files
                    )
                    
                    if has_mp4:
                        brands_with_videos.append(brand_name)
                        
                except Exception as e:
                    # Skip brands that don't have scrolling_brand_media folder
                    print(f"Warning: Could not access scrolling_brand_media for brand {brand_name}: {e}")
                    continue
    
    except Exception as e:
        print(f"Error accessing Supabase storage: {e}")
        raise
    
    return brands_with_videos

def main():
    """Main function to run the script and print results."""
    try:
        brands = get_brands_with_videos()
        print(f"Found {len(brands)} brands with MP4 files in scrolling_brand_media:")
        for brand in brands:
            print(f"  - {brand}")
        return brands
    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    main()
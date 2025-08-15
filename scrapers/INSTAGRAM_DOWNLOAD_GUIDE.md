# Instagram Content Download Guide

## Overview
This guide explains how to download Instagram content for all lowheads brands using the Instaloader tool.

## Current Status
- Profile pictures: Successfully downloading
- Posts, stories, highlights: Require authentication
- Rate limiting: Instagram blocks requests without login

## How to Use

### Option 1: Without Authentication (Limited Content)
```bash
python download_instagram_content.py
```
This will download profile pictures and basic metadata, but won't get posts or stories.

### Option 2: With Authentication (Full Content) - RECOMMENDED

1. **Edit the script** to enable authentication:
   ```python
   # In download_instagram_content.py, change these lines:
   USE_LOGIN = True  # Set to True
   USERNAME = 'your_instagram_username'  # Set your Instagram username
   ```

2. **Run the script**:
   ```bash
   python download_instagram_content.py
   ```

3. **Enter your password** when prompted by Instaloader.

### Option 3: Manual Instaloader Commands

For individual brands, you can run Instaloader manually:

```bash
# Download all content for a specific brand
instaloader --login your_username demiknj

# Download to specific folder
instaloader --login your_username --dirname-pattern downloads/DEMIKNJ/IG demiknj

# Download with all options
instaloader --login your_username --stories --highlights --comments --geotags --tagged --reels --igtv demiknj
```

## Brand Handle Conversion

The script automatically converts brand names to Instagram handles:
- "DEMIKNJ" → "@demiknj"
- "A STONECOLD STUDIOS PRODUCTION" → "@astonecoldstudiosproduction"
- "DESCENDANT" → "@descendant"

## What Gets Downloaded

### With Authentication:
- Profile pictures (current, high-quality)
- All posts (photos and videos)
- Stories (if available)
- Highlights (if available)
- Reels
- IGTV videos
- Comments and captions
- Geotags
- Tagged posts

### Without Authentication:
- Profile pictures (may be cached/old)
- Posts (blocked by Instagram)
- Stories (require login)
- Highlights (require login)
- Other content (blocked)

## File Structure

Content is saved in this structure:
```
downloads/
├── BRAND_NAME/
│   ├── IG/
│   │   ├── profile_pic.jpg
│   │   ├── 20231201_ABC123.jpg (posts)
│   │   ├── 20231201_ABC123.mp4 (videos)
│   │   └── ...
│   └── [other lowheads content]
```

## Troubleshooting

### "Login required" errors
- Set `USE_LOGIN = True` in the script
- Provide your Instagram username
- Enter password when prompted

### "Rate limited" errors
- Wait a few minutes between requests
- Use authentication to reduce rate limiting
- The script includes delays between brands

### "Profile not found" errors
- Check if the Instagram handle exists
- Some brands may not have Instagram accounts
- Verify the handle conversion is correct

## Security Notes

- Your Instagram credentials are stored locally by Instaloader
- Use a dedicated Instagram account for scraping if possible
- Be respectful of Instagram's rate limits
- Don't share your session files

## Example Usage

1. **Set up authentication**:
   ```python
   USE_LOGIN = True
   USERNAME = 'your_instagram_username'
   ```

2. **Run the downloader**:
   ```bash
   python download_instagram_content.py
   ```

3. **Check results**:
   ```bash
   ls downloads/DEMIKNJ/IG/
   ```

4. **View detailed results**:
   ```bash
   cat instagram_download_results.json
   ```

## Current Progress

- Lowheads scraper: Running (80/185 brands processed)
- Instagram downloader: Ready to use with authentication
- Profile pictures: Successfully downloading
- Full content: Requires authentication

## Next Steps

1. Wait for lowheads scraper to finish
2. Set up Instagram authentication
3. Run Instagram downloader for all brands
4. Verify content quality and completeness

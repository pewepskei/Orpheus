import asyncio
import argparse
from playwright.async_api import async_playwright
from playwright_stealth import Stealth
import os
import subprocess

async def download_youtube_video(youtube_url, import_uuid, video_id):
    print(f"Starting YouTube download for: {youtube_url} (UUID: {import_uuid})")
    
    download_dir = os.path.join(f"/app/assets/{video_id}/")

    hls_output_path = os.path.join(download_dir, 'index.m3u8')
    if os.path.exists(hls_output_path):
        print(f"[SKIP] index.m3u8 already exists at {hls_output_path}. Skipping download.")
        return

    os.makedirs(download_dir, exist_ok=True)
    stealth = Stealth()

    max_retries = 2
    async with async_playwright() as p:
        for attempt in range(1, max_retries + 1):
            print(f"Attempt {attempt} to download video: {youtube_url}")
            try:
                print("Launching browser...")
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(accept_downloads=True)

                print("Enabling stealth mode")
                await stealth.apply_stealth_async(context)  # ✅ FIXED HERE

                page = await context.new_page()

                print("Navigating to the downloader site")
                await page.goto("https://downloaderto.com/engf/")

                print("Entering YouTube URL")
                await page.fill(".input-url", youtube_url)

                print("Clicking quality dropdown")
                await page.click(".btn-quality", timeout=10000)

                print("Waiting for quality dropdown to appear")
                await page.wait_for_selector(".dropdown-group", timeout=10000)

                print("Selecting MP4 1080p")
                await page.click(".dropdown-group .quality-video .video-list li[data-value='720']", timeout=10000)

                print("Clicking download button")
                await page.click(".btn-download")

                print("Waiting for progress bar to reach 100%")
                timeout = 600
                while timeout > 0:
                    progress_bar = await page.query_selector(".progress.animate-pulse")
                    if progress_bar:
                        width = await progress_bar.evaluate("el => el.style.width")
                        print(f"Progress bar width: {width}")
                        if width == "100%":
                            print("Progress bar at 100% - starting download")
                            break
                    await asyncio.sleep(10)
                    timeout -= 1
                else:
                    print("Timeout waiting for progress bar to complete")
                    continue

                print("Waiting for download to complete")
                async with page.expect_download() as download_info:
                    await page.click(".progress.animate-pulse", timeout=3800000)

                download = await download_info.value
                download_path = os.path.join(download_dir, f'source.mp4')
                await download.save_as(download_path)

                print(f"Download complete. Saved to: {download_path}")

                # Run ffmpeg to convert to HLS (m3u8)
                print("Converting MP4 to HLS using ffmpeg...")

                hls_output = os.path.join(download_dir, 'index.m3u8')
                command = [
                    "ffmpeg",
                    "-i", download_path,
                    "-codec:", "copy",
                    "-start_number", "0",
                    "-hls_time", "10",
                    "-hls_list_size", "0",
                    "-f", "hls",
                    hls_output
                ]
                subprocess.run(command, check=True)
                print(f"HLS conversion complete. Output: {hls_output}")
                return

            except TimeoutError as te:
                print(f"Timeout error: {te} - {youtube_url}")
            except Exception as e:
                print(f"Error during download attempt {attempt}: {e} - {youtube_url}")
                if attempt == max_retries:
                    print(f"All {max_retries} attempts failed. Exiting.")
                    return
                else:
                    print("Retrying in 5 seconds...")
                    await asyncio.sleep(5)
            finally:
                try:
                    if page and not page.is_closed():
                        print("Closing page")
                        await page.close()
                except Exception as e:
                    print(f"Error closing the page: {e}")

                try:
                    if context:
                        print("Closing context")
                        await context.close()
                except Exception as e:
                    print(f"Error closing the context: {e}")

                try:
                    if browser:
                        print("Closing browser")
                        await browser.close()
                except Exception as e:
                    print(f"Error closing the browser: {e}")

async def main():
    print("Main function called")
    parser = argparse.ArgumentParser(description="Download a YouTube video using Playwright.")
    parser.add_argument("youtube_url", type=str, help="The URL of the YouTube video to download.")
    parser.add_argument("uuid", type=str, help="UUID of import history")
    parser.add_argument("video_id", type=str, help="ID of the video")
    args = parser.parse_args()

    await download_youtube_video(args.youtube_url, args.uuid, args.video_id)

if __name__ == "__main__":
    print("Script execution started")
    asyncio.run(main())
    print("Script execution finished")


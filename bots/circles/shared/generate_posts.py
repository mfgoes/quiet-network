import json
import os
import random
from datetime import datetime, timedelta
from supabase import create_client
from config import CIRCLE, POST_INTERVAL
from bot_users import BOT_USERS

# Connect to Supabase
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)

# Load all JSON files from posts directory
posts_dir = os.path.join(os.path.dirname(__file__), "posts")
posts_data = []

# Ensure posts directory exists
if not os.path.exists(posts_dir):
    print(f"Creating posts directory: {posts_dir}")
    os.makedirs(posts_dir)

# Load all JSON files
try:
    files = os.listdir(posts_dir)
except Exception as e:
    print(f"Error accessing directory {posts_dir}: {str(e)}")
    exit(1)

for filename in files:
    if filename.endswith('.json'):
        try:
            file_path = os.path.join(posts_dir, filename)
            with open(file_path, "r") as f:
                file_posts = json.load(f)
                if isinstance(file_posts, list):
                    posts_data.extend(file_posts)
                else:
                    print(f"Warning: Skipping {filename} - expected list of posts")
        except json.JSONDecodeError:
            print(f"Error: Could not parse JSON file: {filename}")
        except Exception as e:
            print(f"Error processing {filename}: {str(e)}")

if not posts_data:
    print("No posts found in posts directory")
    exit(1)

# Helper function to generate random timestamp: today or yesterday +-12h
def random_post_time():
    base_day = datetime.utcnow().date()
    # choose today or yesterday
    day_offset = random.choice([0, -1])
    base_datetime = datetime.combine(base_day + timedelta(days=day_offset), datetime.min.time())
    # add random hours/minutes ±12h
    delta_hours = random.randint(-12, 12)
    delta_minutes = random.randint(0, 59)
    return base_datetime + timedelta(hours=delta_hours, minutes=delta_minutes)

# Post each item
for post_item in posts_data:
    # Pick random bot user for the main post
    post_user = random.choice(BOT_USERS)
    post_time = random_post_time()

    # Insert main post
    post_resp = supabase.table("posts").insert({
        "circle": CIRCLE,
        "user_id": post_user["id"],
        "content": post_item["post"],
        "created_at": post_time.isoformat()
    }).execute()

    post_id = post_resp.data[0]["id"]
    print(f"Posted: '{post_item['post']}' by {post_user['name']} at {post_time}")

    # Insert replies slightly after the post
    reply_time = post_time
    for reply in post_item.get("replies", []):
        # add 5-30 minutes to previous timestamp for realism
        reply_time += timedelta(minutes=random.randint(5, 30))
        reply_user = random.choice(BOT_USERS)

        supabase.table("posts").insert({
            "circle": CIRCLE,
            "user_id": reply_user["id"],
            "content": reply,
            "parent_id": post_id,
            "created_at": reply_time.isoformat()
        }).execute()

        print(f"  Reply: '{reply}' by {reply_user['name']} at {reply_time}")

    # Optional: wait before next post (simulate spacing if script is long-running)
    # time.sleep(POST_INTERVAL)  # Uncomment if running continuously

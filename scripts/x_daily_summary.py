#!/usr/bin/env python3
"""
X (Twitter) 每日推文汇总采集脚本
自动获取指定博主的近24小时推文，提取标题作为摘要
"""

import feedparser
from datetime import datetime, timedelta
import re

# 配置
TWITTER_USERS = ["xiaohu", "oran_ge", "dotey", "vista8", "Khazix0918"]
RSSHUB_URL = "http://localhost:1200"

def get_recent_posts(username, hours=24):
    """获取用户最近24小时的推文"""
    url = f"{RSSHUB_URL}/twitter/user/{username}"
    feed = feedparser.parse(url)
    
    now = datetime.utcnow()
    cutoff = now - timedelta(hours=hours)
    recent_posts = []
    
    for entry in feed.entries:
        pub_date = entry.get("published", "")
        if pub_date:
            try:
                dt = datetime.strptime(pub_date[:25], "%a, %d %b %Y %H:%M:%S")
                if dt >= cutoff:
                    # 清理HTML标签，提取标题
                    title = re.sub('<[^<]+?>', '', entry.get("title", ""))
                    # 提取摘要前100字
                    summary = re.sub('<[^<]+?>', '', entry.get("summary", ""))
                    summary = summary[:100].strip()
                    
                    recent_posts.append({
                        "title": title.strip(),
                        "summary": summary,
                        "link": entry.get("link", "")
                    })
            except:
                pass
    
    return recent_posts

def main():
    print(f"=== X 每日推文汇总 {datetime.now().strftime('%Y-%m-%d')} ===\n")
    
    all_posts = {}
    total = 0
    
    for user in TWITTER_USERS:
        posts = get_recent_posts(user, hours=24)
        if posts:
            all_posts[user] = posts
            print(f"📱 @{user}: {len(posts)}条")
            
            for i, p in enumerate(posts[:5]):
                # 标题作为摘要
                title = p["title"]
                # 截断到合适长度
                if len(title) > 60:
                    title = title[:60] + "..."
                link = p["link"]
                
                print(f"  {i+1}. {title}")
                print(f"     🔗 {link}")
                total += 1
            
            if len(posts) > 5:
                print(f"  ... 还有 {len(posts) - 5} 条")
            print()
    
    if not all_posts:
        print("最近24小时无新推文")
    else:
        print(f"共 {sum(len(v) for v in all_posts.values())} 条推文")

if __name__ == "__main__":
    main()

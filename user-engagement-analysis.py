#!/usr/bin/env python3
"""
ReviewCruncher User Engagement Analysis
Analyzes user activity patterns and suggests engagement strategies
"""

import json
from collections import defaultdict
from datetime import datetime

def analyze_user_engagement():
    # Load data
    with open('/opt/Review-Cruncher/data.json', 'r') as f:
        data = json.load(f)
    
    user_stats = defaultdict(lambda: {'reviews': 0, 'last_activity': None, 'products': []})
    
    # Analyze each review
    for review in data['reviews']:
        email = review['email']
        timestamp = review['timestamp']
        product = review.get('product', 'Unknown')
        
        # Skip internal/test users
        if 'gabor' in email.lower() or 'test@test.com' in email:
            continue
            
        user_stats[email]['reviews'] += 1
        user_stats[email]['products'].append(product)
        
        # Update last activity
        if not user_stats[email]['last_activity'] or timestamp > user_stats[email]['last_activity']:
            user_stats[email]['last_activity'] = timestamp
    
    # Generate engagement insights
    print("=== USER ENGAGEMENT ANALYSIS ===")
    print(f"Total external users: {len(user_stats)}")
    
    # Categorize users
    power_users = []
    moderate_users = []
    new_users = []
    
    for email, stats in user_stats.items():
        if stats['reviews'] >= 5:
            power_users.append((email, stats))
        elif stats['reviews'] >= 2:
            moderate_users.append((email, stats))
        else:
            new_users.append((email, stats))
    
    print(f"\nPOWER USERS ({len(power_users)}):")
    for email, stats in sorted(power_users, key=lambda x: x[1]['reviews'], reverse=True):
        print(f"  {email}: {stats['reviews']} reviews, last: {stats['last_activity'][:10]}")
    
    print(f"\nMODERATE USERS ({len(moderate_users)}):")
    for email, stats in sorted(moderate_users, key=lambda x: x[1]['reviews'], reverse=True):
        print(f"  {email}: {stats['reviews']} reviews, last: {stats['last_activity'][:10]}")
    
    print(f"\nNEW/SINGLE-USE USERS ({len(new_users)}):")
    for email, stats in sorted(new_users, key=lambda x: x[1]['last_activity'], reverse=True)[:10]:
        print(f"  {email}: {stats['reviews']} reviews, last: {stats['last_activity'][:10]}")
    
    print(f"\nENGAGEMENT OPPORTUNITIES:")
    print(f"- {len(new_users)} users with only 1 review (conversion opportunity)")
    print(f"- Focus on converting moderate users to power users")
    print(f"- Power users could be ambassadors/beta testers")
    
    # Save analysis
    analysis = {
        'date': datetime.now().isoformat(),
        'total_users': len(user_stats),
        'power_users': len(power_users),
        'moderate_users': len(moderate_users),
        'new_users': len(new_users),
        'top_users': [(email, stats['reviews']) for email, stats in sorted(user_stats.items(), key=lambda x: x[1]['reviews'], reverse=True)[:10]]
    }
    
    with open('/opt/Review-Cruncher/engagement-analysis.json', 'w') as f:
        json.dump(analysis, f, indent=2)
    
    return analysis

if __name__ == "__main__":
    analyze_user_engagement()
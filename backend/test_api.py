#!/usr/bin/env python
"""
Test script for the AI Learning Assistant API
Run this after starting the Django server
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_register():
    """Test user registration"""
    print("\n=== Testing User Registration ===")
    url = f"{BASE_URL}/auth/register/"
    data = {
        "email": "test@example.com",
        "username": "testuser",
        "first_name": "Test",
        "last_name": "User",
        "password": "testpass123",
        "password_confirm": "testpass123"
    }
    try:
        response = requests.post(url, json=data)
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            print("✓ Registration successful!")
            result = response.json()
            return result.get('user', {}).get('id')
        else:
            print(f"✗ Registration failed: {response.text}")
            return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def test_login():
    """Test user login"""
    print("\n=== Testing User Login ===")
    url = f"{BASE_URL}/auth/login/"
    data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    try:
        response = requests.post(url, json=data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✓ Login successful!")
            result = response.json()
            return result.get('access')
        else:
            print(f"✗ Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def test_profile(token):
    """Test getting user profile"""
    print("\n=== Testing User Profile ===")
    url = f"{BASE_URL}/auth/profile/"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(url, headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✓ Profile retrieved successfully!")
            print(f"User: {response.json()}")
        else:
            print(f"✗ Failed: {response.text}")
    except Exception as e:
        print(f"✗ Error: {e}")

def test_dashboard_stats(token):
    """Test dashboard statistics"""
    print("\n=== Testing Dashboard Stats ===")
    url = f"{BASE_URL}/dashboard/stats/"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(url, headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✓ Dashboard stats retrieved!")
            print(f"Stats: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"✗ Failed: {response.text}")
    except Exception as e:
        print(f"✗ Error: {e}")

def main():
    print("=" * 50)
    print("AI Learning Assistant API Test")
    print("=" * 50)
    
    # Test registration
    user_id = test_register()
    
    # Test login
    token = test_login()
    
    if token:
        # Test authenticated endpoints
        test_profile(token)
        test_dashboard_stats(token)
    
    print("\n" + "=" * 50)
    print("Test completed!")
    print("=" * 50)

if __name__ == "__main__":
    main()


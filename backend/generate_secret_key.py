#!/usr/bin/env python
"""
Quick script to generate Django secret key
Run: python generate_secret_key.py
"""
import secrets
import string

def generate_secret_key():
    """Generate a Django-compatible secret key"""
    chars = string.ascii_letters + string.digits + '!@#$%^&*(-_=+)'
    return ''.join(secrets.choice(chars) for _ in range(50))

if __name__ == '__main__':
    print(generate_secret_key())


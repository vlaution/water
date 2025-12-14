#!/usr/bin/env python3
"""
CLI tool for administrative tasks.
Usage: python admin_cli.py <command> [args]
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from database.models import SessionLocal, User, UserRole
from auth.jwt_handler import get_password_hash

def promote_to_admin(email: str):
    """Promote a user to admin role."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"❌ User with email '{email}' not found")
            return False
        
        if user.role == UserRole.admin:
            print(f"ℹ️  User '{email}' is already an admin")
            return True
        
        user.role = UserRole.admin
        db.commit()
        print(f"✅ User '{email}' promoted to admin")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def create_admin(email: str, password: str, name: str):
    """Create a new admin user."""
    db = SessionLocal()
    try:
        # Check if user exists
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"❌ User with email '{email}' already exists")
            return False
        
        # Create admin user
        user = User(
            email=email,
            password=get_password_hash(password),
            name=name,
            role=UserRole.admin
        )
        db.add(user)
        db.commit()
        print(f"✅ Admin user '{email}' created successfully")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def list_admins():
    """List all admin users."""
    db = SessionLocal()
    try:
        admins = db.query(User).filter(User.role == UserRole.admin).all()
        if not admins:
            print("No admin users found")
            return
        
        print("\n📋 Admin Users:")
        print("-" * 60)
        for admin in admins:
            print(f"  • {admin.email} ({admin.name})")
        print("-" * 60)
        print(f"Total: {len(admins)} admin(s)\n")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

def show_help():
    """Show help message."""
    help_text = """
🔧 Admin CLI Tool

Commands:
  promote <email>                    Promote existing user to admin
  create <email> <password> <name>   Create new admin user
  list                               List all admin users
  help                               Show this help message

Examples:
  python admin_cli.py promote user@example.com
  python admin_cli.py create admin@example.com SecurePass123 "Admin User"
  python admin_cli.py list
"""
    print(help_text)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        show_help()
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "promote":
        if len(sys.argv) < 3:
            print("❌ Usage: python admin_cli.py promote <email>")
            sys.exit(1)
        promote_to_admin(sys.argv[2])
    
    elif command == "create":
        if len(sys.argv) < 5:
            print("❌ Usage: python admin_cli.py create <email> <password> <name>")
            sys.exit(1)
        create_admin(sys.argv[2], sys.argv[3], sys.argv[4])
    
    elif command == "list":
        list_admins()
    
    elif command == "help":
        show_help()
    
    else:
        print(f"❌ Unknown command: {command}")
        show_help()
        sys.exit(1)

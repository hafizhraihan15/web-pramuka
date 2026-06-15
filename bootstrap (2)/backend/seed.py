#!/usr/bin/env python3
"""
Seed script - Insert test data ke database
Run: python seed.py
"""
from database import SessionLocal, engine
import models
from datetime import date, timedelta
from auth import hash_password
import os
import secrets

test_password = os.getenv("SEED_TEST_PASSWORD") or secrets.token_urlsafe(16)
if len(test_password) < 8:
    raise SystemExit("SEED_TEST_PASSWORD minimal 8 karakter")

# Init
db = SessionLocal()

try:
    # Clear existing data (optional)
    # db.query(models.User).delete()
    # db.query(models.Ambalan).delete()
    # db.query(models.Member).delete()
    # db.commit()
    
    # 1. Create Test Users
    print("Creating test users...")
    user1 = models.User(
        email="hangtuah@test.com",
        password_hash=hash_password(test_password)
    )
    user2 = models.User(
        email="dangmerdu@test.com",
        password_hash=hash_password(test_password)
    )
    db.add(user1)
    db.add(user2)
    db.commit()
    db.refresh(user1)
    db.refresh(user2)
    print(f"✓ Created users: {user1.email}, {user2.email}")
    
    # 2. Create Ambalans (if not exist)
    print("\nCreating ambalans...")
    ambalan1 = db.query(models.Ambalan).filter_by(name="Hangtuah").first()
    if not ambalan1:
        ambalan1 = models.Ambalan(name="Hangtuah", description="Ambalan Hangtuah - Laksana Panglima")
        db.add(ambalan1)
    
    ambalan2 = db.query(models.Ambalan).filter_by(name="Dang Merdu").first()
    if not ambalan2:
        ambalan2 = models.Ambalan(name="Dang Merdu", description="Ambalan Dang Merdu - Pembawa Keadilan")
        db.add(ambalan2)
    
    db.commit()
    db.refresh(ambalan1)
    db.refresh(ambalan2)
    print(f"✓ Created ambalans: {ambalan1.name}, {ambalan2.name}")
    
    # 3. Create Test Members
    print("\nCreating test members...")
    members_data = [
        {"name": "Ahmad Fauzi", "nis": "001", "class": "X-A", "ambalan_id": ambalan1.id, "user_id": user1.id},
        {"name": "Budi Santoso", "nis": "002", "class": "X-A", "ambalan_id": ambalan1.id},
        {"name": "Citra Dewi", "nis": "003", "class": "X-B", "ambalan_id": ambalan1.id},
        {"name": "Desi Pratama", "nis": "004", "class": "X-B", "ambalan_id": ambalan2.id, "user_id": user2.id},
        {"name": "Eka Wijaya", "nis": "005", "class": "X-C", "ambalan_id": ambalan2.id},
        {"name": "Fiona Kusuma", "nis": "006", "class": "X-C", "ambalan_id": ambalan2.id},
    ]
    
    for data in members_data:
        member = models.Member(
            name=data["name"],
            nis=data["nis"],
            class_name=data["class"],
            ambalan_id=data["ambalan_id"],
            user_id=data.get("user_id"),
            status="accepted"
        )
        db.add(member)
    
    db.commit()
    print(f"✓ Created {len(members_data)} members")
    
    # 4. Get members for attendance data
    members = db.query(models.Member).all()
    
    # 5. Create Test Attendance Records
    print("\nCreating attendance records...")
    today = date.today()
    for member in members[:3]:  # Only first 3 members
        for i in range(5):  # Last 5 days
            attendance = models.Attendance(
                member_id=member.id,
                attendance_date=today - timedelta(days=i),
                status="Hadir" if i % 2 == 0 else "Izin",
                note="Izin keluarga" if i % 2 == 1 else None
            )
            db.add(attendance)
    
    db.commit()
    print(f"✓ Created attendance records")
    
    # 6. Create Test Program Registrations
    print("\nCreating program registrations...")
    programs = db.query(models.Program).all()
    
    for i, member in enumerate(members[:4]):
        for program in programs[:2]:  # Register to first 2 programs
            existing = db.query(models.ProgramRegistration).filter(
                models.ProgramRegistration.member_id == member.id,
                models.ProgramRegistration.program_id == program.id
            ).first()
            
            if not existing:
                registration = models.ProgramRegistration(
                    member_id=member.id,
                    program_id=program.id
                )
                db.add(registration)
    
    db.commit()
    print(f"✓ Created program registrations")
    
    # 7. Create Test Letter Requests
    print("\nCreating letter requests...")
    letter_types = ["Surat Izin", "Surat Keterangan", "Surat Rekomendasi"]
    
    for member in members[:3]:
        letter = models.LetterRequest(
            member_id=member.id,
            letter_type=letter_types[0],
            purpose="Mengikuti kegiatan di luar sekolah",
            recipient="Kepala Sekolah",
            status="Pending"
        )
        db.add(letter)
        
        letter2 = models.LetterRequest(
            member_id=member.id,
            letter_type=letter_types[1],
            purpose="Keaktifan di Pramuka",
            recipient="Ketua Pangkalan",
            status="Selesai"
        )
        db.add(letter2)
    
    db.commit()
    print(f"✓ Created letter requests")
    
    print("\n✅ Database seeding completed!")
    print(f"\nTest Login Credentials:")
    print(f"  - Email: hangtuah@test.com | Password: {test_password}")
    print(f"  - Email: dangmerdu@test.com | Password: {test_password}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()

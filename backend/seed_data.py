#!/usr/bin/env python3
"""
Sample data seeder for Dear, Tear
Creates sample users, sessions, and biomechanics data for testing
"""

import sys
from datetime import datetime, timedelta
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import models from main.py
sys.path.append('.')
from main import Base, User, TrainingSession, BiomechanicsData, RiskAssessment, RehabilitationPlan

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./aclguard.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_data():
    db = SessionLocal()
    
    try:
        # Create sample athletes
        athletes = [
            User(
                email="athlete1@example.com",
                name="Emily Martinez",
                role="athlete",
                age=16,
                gender="female",
                bmi=22.5,
                location="New Orleans",
                is_rural=False
            ),
            User(
                email="athlete2@example.com",
                name="James Wilson",
                role="athlete",
                age=17,
                gender="male",
                bmi=28.2,
                location="Shreveport",
                is_rural=True
            ),
            User(
                email="athlete3@example.com",
                name="Sarah Johnson",
                role="athlete",
                age=15,
                gender="female",
                bmi=24.8,
                location="Lafayette",
                is_rural=False
            ),
        ]
        
        # Create coach and provider
        coach = User(
            email="coach@example.com",
            name="Coach Thompson",
            role="coach",
            location="Baton Rouge"
        )
        
        provider = User(
            email="provider@example.com",
            name="Dr. Sarah Johnson",
            role="provider",
            location="New Orleans"
        )
        
        for athlete in athletes:
            db.add(athlete)
        db.add(coach)
        db.add(provider)
        db.commit()
        
        # Create training sessions for each athlete
        for athlete in athletes:
            for i in range(5):
                session_start = datetime.now() - timedelta(days=i*2)
                session = TrainingSession(
                    athlete_id=athlete.id,
                    session_type=random.choice(["practice", "game", "training"]),
                    sport=random.choice(["football", "soccer", "basketball"]),
                    duration_minutes=random.randint(60, 120),
                    start_time=session_start,
                    end_time=session_start + timedelta(minutes=random.randint(60, 120))
                )
                db.add(session)
                db.flush()
                
                # Add biomechanics data for each session
                num_data_points = random.randint(20, 50)
                high_risk_count = 0
                valgus_values = []
                impact_forces = []
                
                for j in range(num_data_points):
                    # Simulate high-risk movements 15% of the time
                    is_high_risk = random.random() < 0.15
                    
                    knee_valgus = random.uniform(18, 22) if is_high_risk else random.uniform(8, 14)
                    ground_force = random.uniform(3.5, 4.5) if is_high_risk else random.uniform(2.0, 3.0)
                    
                    if is_high_risk:
                        high_risk_count += 1
                    
                    valgus_values.append(knee_valgus)
                    impact_forces.append(ground_force)
                    
                    data_point = BiomechanicsData(
                        session_id=session.id,
                        timestamp=session_start + timedelta(seconds=j*30),
                        knee_angle=random.uniform(155, 175),
                        hip_angle=random.uniform(160, 180),
                        ankle_angle=random.uniform(80, 95),
                        knee_valgus=knee_valgus,
                        ground_reaction_force=ground_force,
                        movement_type=random.choice(["landing", "cutting", "pivoting", "jumping"]),
                        risk_score=0.7 if is_high_risk else random.uniform(0.2, 0.5)
                    )
                    db.add(data_point)
                
                # Update session summary
                session.high_risk_movements = high_risk_count
                session.avg_knee_valgus = sum(valgus_values) / len(valgus_values) if valgus_values else None
                session.peak_impact_force = max(impact_forces) if impact_forces else None
                session.avg_landing_force = sum(impact_forces) / len(impact_forces) if impact_forces else None
        
        db.commit()
        
        print("✓ Created sample athletes, coach, and provider")
        print("✓ Created training sessions with biomechanics data")
        print("\nSample athlete IDs:")
        for athlete in athletes:
            print(f"  - {athlete.name} (ID: {athlete.id})")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Seeding Dear, Tear database with sample data...")
    seed_data()
    print("\n✓ Seeding complete!")

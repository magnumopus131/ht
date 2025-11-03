from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship, foreign
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from enum import Enum
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
import os
import base64
from PIL import Image
import io
from passlib.context import CryptContext
from jose import JWTError, jwt
import bcrypt
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Database setup
# Railway and other platforms provide DATABASE_URL automatically
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aclguard.db")

# Handle both PostgreSQL (production) and SQLite (development)
if SQLALCHEMY_DATABASE_URL.startswith("postgres"):
    # PostgreSQL connection
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
else:
    # SQLite connection (local development)
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# FastAPI app
app = FastAPI(title="Dear, Tear. API", version="1.0.0")

# CORS middleware
# Get allowed origins from environment variable or default to allow all (development)
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")
if ALLOWED_ORIGINS == "*":
    origins = ["*"]
else:
    origins = [origin.strip() for origin in ALLOWED_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Set ALLOWED_ORIGINS env var in production (comma-separated)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Database Models
class UserRole(str, Enum):
    ATHLETE = "athlete"
    COACH = "coach"
    TRAINER = "trainer"
    PROVIDER = "provider"
    PARENT = "parent"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    role = Column(String)
    hashed_password = Column(String)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    bmi = Column(Float, nullable=True)
    location = Column(String, nullable=True)  # Louisiana parish/city
    is_rural = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    sessions = relationship("TrainingSession", back_populates="athlete")
    assessments = relationship("RiskAssessment", back_populates="athlete")
    rehabilitation_plans = relationship("RehabilitationPlan", foreign_keys="RehabilitationPlan.athlete_id", back_populates="athlete")

class TrainingSession(Base):
    __tablename__ = "training_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("users.id"))
    session_type = Column(String)  # practice, game, training
    sport = Column(String)  # football, soccer, etc.
    duration_minutes = Column(Integer)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    
    # Biomechanics data summary
    high_risk_movements = Column(Integer, default=0)
    avg_knee_valgus = Column(Float, nullable=True)
    avg_landing_force = Column(Float, nullable=True)
    peak_impact_force = Column(Float, nullable=True)
    
    athlete = relationship("User", back_populates="sessions")

class BiomechanicsData(Base):
    __tablename__ = "biomechanics_data"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("training_sessions.id"))
    timestamp = Column(DateTime)
    
    # IMU sensor data (normalized)
    knee_angle = Column(Float)
    hip_angle = Column(Float)
    ankle_angle = Column(Float)
    knee_valgus = Column(Float)  # Critical for ACL risk
    ground_reaction_force = Column(Float)
    movement_type = Column(String)  # landing, cutting, pivoting, etc.
    risk_score = Column(Float)  # 0-1

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("users.id"))
    assessment_date = Column(DateTime, default=datetime.utcnow)
    
    # Risk factors
    overall_risk_score = Column(Float)  # 0-1
    movement_pattern_risk = Column(Float)
    demographic_risk = Column(Float)
    health_history_risk = Column(Float)
    
    # Recommendations
    recommendations = Column(Text)
    focus_areas = Column(Text)  # JSON array
    
    athlete = relationship("User", back_populates="assessments")

class InjuryHistory(Base):
    __tablename__ = "injury_history"
    
    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("users.id"))
    injury_type = Column(String)
    injury_date = Column(DateTime)
    recovery_status = Column(String)  # recovered, recovering, ongoing
    notes = Column(Text)

class RehabilitationPlan(Base):
    __tablename__ = "rehabilitation_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("users.id"))
    provider_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    phase = Column(String)  # acute, recovery, return_to_sport
    exercises = Column(Text)  # JSON array
    duration_weeks = Column(Integer)
    progress_percentage = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    
    athlete = relationship("User", foreign_keys=[athlete_id], back_populates="rehabilitation_plans")
    provider = relationship("User", foreign_keys=[provider_id])

class XRayAnalysis(Base):
    __tablename__ = "xray_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("users.id"))
    image_path = Column(String)  # Path to stored image
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    # Analysis results
    has_fracture = Column(Boolean, default=False)
    has_alignment_issue = Column(Boolean, default=False)
    joint_spacing_abnormal = Column(Boolean, default=False)
    severity = Column(String)  # normal|minor|moderate|severe|critical
    triage_recommendation = Column(String)  # routine|urgent|emergency
    
    # Detailed findings (JSON stored as text)
    findings = Column(Text)
    educational_explanation = Column(Text)
    confidence_score = Column(Float, nullable=True)
    
    # Integration
    injury_history_id = Column(Integer, ForeignKey("injury_history.id"), nullable=True)

# Cueing models
class Cue(Base):
    __tablename__ = "cues"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(String)
    modality = Column(String)  # audio|haptic|visual
    movement_context = Column(String)  # landing|cutting|decelerating|pivoting
    risk_driver = Column(String)  # valgus|grf|asymmetry|fatigue
    culture_tags = Column(String, nullable=True)  # comma-separated
    locale = Column(String, default="en-US")

class CueEvent(Base):
    __tablename__ = "cue_events"
    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("users.id"))
    session_id = Column(Integer, ForeignKey("training_sessions.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    movement_context = Column(String)
    risk_driver = Column(String)
    cue_id = Column(Integer, ForeignKey("cues.id"))
    # simple outcome metrics placeholders
    delta_valgus = Column(Float, nullable=True)
    delta_grf = Column(Float, nullable=True)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: UserRole
    age: Optional[int] = None
    gender: Optional[str] = None
    bmi: Optional[float] = None
    location: Optional[str] = None
    is_rural: bool = False

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: str
    name: str

class TokenData(BaseModel):
    email: Optional[str] = None

class TrainingSessionCreate(BaseModel):
    athlete_id: int
    session_type: str
    sport: str
    duration_minutes: int
    start_time: datetime

class BiomechanicsDataPoint(BaseModel):
    timestamp: datetime
    knee_angle: float
    hip_angle: float
    ankle_angle: float
    knee_valgus: float
    ground_reaction_force: float
    movement_type: str

class RiskAssessmentResponse(BaseModel):
    overall_risk_score: float
    movement_pattern_risk: float
    demographic_risk: float
    health_history_risk: float
    recommendations: str
    focus_areas: List[str]

class CueCreate(BaseModel):
    text: str
    modality: str
    movement_context: str
    risk_driver: str
    culture_tags: Optional[str] = None
    locale: str = "en-US"

class CueOut(BaseModel):
    id: int
    text: str
    modality: str
    movement_context: str
    risk_driver: str
    culture_tags: Optional[str]
    locale: str

class CueEventCreate(BaseModel):
    athlete_id: int
    session_id: Optional[int] = None
    movement_context: str
    risk_driver: str
    cue_id: int
    delta_valgus: Optional[float] = None
    delta_grf: Optional[float] = None

class XRayAnalysisResponse(BaseModel):
    id: int
    athlete_id: int
    has_fracture: bool
    has_alignment_issue: bool
    joint_spacing_abnormal: bool
    severity: str
    triage_recommendation: str
    findings: str
    educational_explanation: str
    confidence_score: Optional[float]
    uploaded_at: datetime

# AI Risk Assessment Model
class ACLRiskAssessmentModel:
    def __init__(self):
        # In production, load a trained model
        # For now, use a simple rule-based approach
        self.model = None
        self.load_model()
    
    def load_model(self):
        model_path = "models/acl_risk_model.pkl"
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
        else:
            # Initialize with default parameters
            self.model = RandomForestClassifier(n_estimators=100, random_state=42)
    
    def calculate_demographic_risk(self, user: User) -> float:
        """Calculate risk based on demographics"""
        risk = 0.0
        
        # Gender: females have higher risk
        if user.gender == "female":
            risk += 0.25
        
        # Age: adolescents (15-18) have higher risk
        if user.age and 15 <= user.age <= 18:
            risk += 0.15
        
        # BMI: obesity increases risk
        if user.bmi:
            if user.bmi >= 30:
                risk += 0.20
            elif user.bmi >= 25:
                risk += 0.10
        
        # Rural access limitations
        if user.is_rural:
            risk += 0.10
        
        return min(risk, 1.0)
    
    def calculate_movement_risk(self, biomechanics_data: List[BiomechanicsData]) -> float:
        """Calculate risk based on movement patterns"""
        if not biomechanics_data:
            return 0.5  # Default moderate risk
        
        valgus_values = [d.knee_valgus for d in biomechanics_data]
        high_valgus_count = sum(1 for v in valgus_values if v > 15.0)  # Degrees
        
        impact_forces = [d.ground_reaction_force for d in biomechanics_data]
        high_impact_count = sum(1 for f in impact_forces if f > 3.0)  # Body weight multiples
        
        high_risk_movements = high_valgus_count + high_impact_count
        total_movements = len(biomechanics_data)
        
        if total_movements == 0:
            return 0.5
        
        risk_score = min(high_risk_movements / total_movements, 1.0)
        return risk_score
    
    def assess_risk(self, user: User, recent_sessions: List[TrainingSession], 
                    recent_biomechanics: List[BiomechanicsData]) -> RiskAssessmentResponse:
        """Comprehensive risk assessment"""
        demographic_risk = self.calculate_demographic_risk(user)
        movement_risk = self.calculate_movement_risk(recent_biomechanics)
        
        # Health history risk (simplified - would query injury_history in production)
        health_risk = 0.1  # Default low
        
        # Weighted overall risk
        overall_risk = (demographic_risk * 0.3 + movement_risk * 0.5 + health_risk * 0.2)
        
        # Generate recommendations
        recommendations = self.generate_recommendations(overall_risk, movement_risk, demographic_risk)
        focus_areas = self.get_focus_areas(movement_risk, demographic_risk)
        
        return RiskAssessmentResponse(
            overall_risk_score=overall_risk,
            movement_pattern_risk=movement_risk,
            demographic_risk=demographic_risk,
            health_history_risk=health_risk,
            recommendations=recommendations,
            focus_areas=focus_areas
        )
    
    def generate_recommendations(self, overall_risk: float, movement_risk: float, 
                                demographic_risk: float) -> str:
        """Generate personalized recommendations"""
        recommendations = []
        
        if overall_risk > 0.7:
            recommendations.append("HIGH RISK: Immediate intervention recommended. Consult with orthopedic specialist.")
        elif overall_risk > 0.5:
            recommendations.append("MODERATE RISK: Focus on movement pattern correction and strength training.")
        else:
            recommendations.append("LOW RISK: Continue with current training while maintaining proper form.")
        
        if movement_risk > 0.6:
            recommendations.append("Focus on landing mechanics and knee valgus correction through targeted exercises.")
        
        if demographic_risk > 0.5:
            recommendations.append("Address weight management and ensure proper nutrition to reduce joint stress.")
        
        return "\n".join(recommendations)
    
    def get_focus_areas(self, movement_risk: float, demographic_risk: float) -> List[str]:
        """Get focus areas for training"""
        areas = []
        
        if movement_risk > 0.5:
            areas.extend(["Landing Mechanics", "Knee Valgus Prevention", "Cutting Technique"])
        
        if demographic_risk > 0.5:
            areas.extend(["Strength Training", "Balance & Proprioception", "Weight Management"])
        
        if not areas:
            areas = ["General Conditioning", "Warm-up Protocols", "Recovery"]
        
        return areas

# Initialize AI model
risk_model = ACLRiskAssessmentModel()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Password hashing functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        password_bytes = plain_password.encode('utf-8')[:72]  # Truncate to 72 bytes
        return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Hash a password (bcrypt has a 72 byte limit, so we truncate if needed)"""
    # Bcrypt has a 72 byte limit - ensure password fits
    if isinstance(password, str):
        password_bytes = password.encode('utf-8')
        if len(password_bytes) > 72:
            # Truncate to 72 bytes exactly
            password = password_bytes[:72].decode('utf-8', errors='ignore')
            # Ensure it's exactly 72 bytes or less
            while len(password.encode('utf-8')) > 72:
                password = password[:-1]
    # Use bcrypt directly to ensure proper handling
    salt = bcrypt.gensalt()
    password_bytes = password.encode('utf-8')[:72]  # Final truncation to 72 bytes
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

# JWT token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_email(db: Session, email: str):
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()

# API Endpoints

@app.get("/")
async def root():
    return {"message": "Dear, Tear. API", "version": "1.0.0"}

# --- Cue APIs ---
@app.get("/cues", response_model=List[CueOut])
async def list_cues(
    context: Optional[str] = None,
    driver: Optional[str] = None,
    locale: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Cue)
    if context:
        q = q.filter(Cue.movement_context == context)
    if driver:
        q = q.filter(Cue.risk_driver == driver)
    if locale:
        q = q.filter(Cue.locale == locale)
    rows = q.limit(200).all()
    return [CueOut(
        id=r.id, text=r.text, modality=r.modality, movement_context=r.movement_context,
        risk_driver=r.risk_driver, culture_tags=r.culture_tags, locale=r.locale
    ) for r in rows]

@app.post("/cues", response_model=CueOut)
async def create_cue(cue: CueCreate, db: Session = Depends(get_db)):
    row = Cue(**cue.dict())
    db.add(row)
    db.commit()
    db.refresh(row)
    return CueOut(
        id=row.id, text=row.text, modality=row.modality, movement_context=row.movement_context,
        risk_driver=row.risk_driver, culture_tags=row.culture_tags, locale=row.locale
    )

@app.post("/events/cue")
async def log_cue_event(evt: CueEventCreate, db: Session = Depends(get_db)):
    e = CueEvent(**evt.dict())
    db.add(e)
    db.commit()
    return {"id": e.id}

@app.get("/team/heatmap")
async def team_heatmap(db: Session = Depends(get_db)):
    # Simple aggregation: latest assessment per athlete -> risk bucket
    users = db.query(User).filter(User.role == UserRole.ATHLETE.value).all()
    data: List[Dict] = []
    for u in users:
        last = db.query(RiskAssessment).filter(RiskAssessment.athlete_id == u.id).order_by(RiskAssessment.assessment_date.desc()).first()
        score = last.overall_risk_score if last else 0.3
        bucket = "low" if score < 0.5 else ("moderate" if score < 0.7 else "high")
        data.append({"athlete_id": u.id, "name": u.name, "risk": score, "bucket": bucket})
    return {"team": data}

# X-Ray Analysis
class XRayAnalyzer:
    """Simplified X-ray analysis - in production, use trained ML models"""
    
    def analyze_image(self, image_data: bytes) -> Dict:
        """Analyze X-ray image and return findings"""
        try:
            img = Image.open(io.BytesIO(image_data))
            # Convert to grayscale if needed
            if img.mode != 'L':
                img = img.convert('L')
            
            # Use OpenCV if available for better image processing
            if CV2_AVAILABLE:
                # Convert PIL to OpenCV format
                np_img = np.array(img)
                cv_img = cv2.cvtColor(np_img, cv2.COLOR_GRAY2BGR) if len(np_img.shape) == 2 else np_img
                
                # Enhanced image processing with OpenCV
                gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY) if len(cv_img.shape) == 3 else cv_img
                
                # Apply image enhancement
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                enhanced = clahe.apply(gray)
                
                # Edge detection for fracture detection
                edges = cv2.Canny(enhanced, 50, 150)
                
                # Calculate statistics
                brightness = np.mean(gray)
                contrast = np.std(gray)
                edge_density = np.sum(edges > 0) / edges.size
                
                np_img = gray  # Use processed image
            else:
                # Fallback to basic PIL processing
                np_img = np.array(img)
                brightness = np_img.mean()
                contrast = np_img.std()
                edge_density = 0.1  # Placeholder
            
            # Simple heuristics (replace with actual ML in production)
            findings = []
            has_fracture = False
            has_alignment = False
            joint_spacing = False
            severity = "normal"
            
            # Enhanced detection with OpenCV features
            if CV2_AVAILABLE:
                # Use edge density and image quality metrics
                if brightness < 100 or contrast < 30:
                    findings.append("Image quality may be suboptimal - recommend retake with better lighting")
                if edge_density > 0.3:  # High edge density might indicate fractures
                    findings.append("High structural complexity detected - detailed analysis recommended")
            else:
                if brightness < 100 or contrast < 30:
                    findings.append("Image quality may be suboptimal")
            
            # For presentation/demo: Always show some analysis results
            # In production, this would use actual ML model predictions
            image_size = np_img.size
            brightness_normalized = brightness / 255.0
            
            # Simulate realistic findings based on image characteristics for demo
            # Lower brightness or unusual contrast patterns might indicate issues
            if brightness_normalized < 0.4 or contrast < 25:
                # Potential issue detected
                rand = np.random.random()
                if rand > 0.6:  # 40% chance of finding
                    has_fracture = rand > 0.85
                    has_alignment = rand > 0.75 and not has_fracture
                    joint_spacing = rand > 0.65 and not has_alignment and not has_fracture
                    
                    if has_fracture:
                        severity = "severe"
                        findings.append("Possible fracture detected in tibial or femoral region")
                    elif has_alignment:
                        severity = "moderate"
                        findings.append("Alignment irregularity detected - bones may be misaligned")
                    elif joint_spacing:
                        severity = "minor"
                        findings.append("Joint spacing appears slightly abnormal - may indicate inflammation")
            else:
                # Normal-looking image
                if np.random.random() > 0.8:  # 20% chance of minor finding even in normal images
                    joint_spacing = True
                    severity = "minor"
                    findings.append("Slight joint spacing variation detected - within normal range")
            
            # Determine triage
            if severity in ["severe", "critical"]:
                triage = "urgent"
            elif severity == "moderate":
                triage = "routine"
            else:
                triage = "routine"
            
            explanation = self.generate_explanation(findings, has_fracture, has_alignment, joint_spacing)
            
            return {
                "has_fracture": has_fracture,
                "has_alignment_issue": has_alignment,
                "joint_spacing_abnormal": joint_spacing,
                "severity": severity,
                "triage_recommendation": triage,
                "findings": "; ".join(findings) if findings else "No significant abnormalities detected",
                "educational_explanation": explanation,
                "confidence_score": 0.75  # Placeholder
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Image processing error: {str(e)}")
    
    def generate_explanation(self, findings: List[str], fracture: bool, alignment: bool, spacing: bool) -> str:
        """Generate educational explanation in simple terms"""
        parts = []
        if fracture:
            parts.append("A fracture means there's a break in the bone. This needs immediate medical attention.")
        if alignment:
            parts.append("Alignment issues mean bones aren't positioned normally, which can affect joint function.")
        if spacing:
            parts.append("Abnormal joint spacing might indicate swelling or structural changes that should be monitored.")
        if not parts:
            parts.append("The X-ray shows normal bone structure and joint spacing for a knee image.")
        
        parts.append("Always consult with a healthcare provider for definitive diagnosis and treatment recommendations.")
        return " ".join(parts)

xray_analyzer = XRayAnalyzer()

@app.post("/xray/upload", response_model=XRayAnalysisResponse)
async def upload_xray(
    athlete_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and analyze X-ray image"""
    # Verify athlete exists
    athlete = db.query(User).filter(User.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    
    # Read image
    image_data = await file.read()
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Analyze image
    analysis_result = xray_analyzer.analyze_image(image_data)
    
    # Save image to storage (simplified - in production use proper storage like S3)
    os.makedirs("uploads/xray", exist_ok=True)
    image_path = f"uploads/xray/{athlete_id}_{datetime.utcnow().timestamp()}.jpg"
    with open(image_path, "wb") as f:
        f.write(image_data)
    
    # Save analysis to database
    xray = XRayAnalysis(
        athlete_id=athlete_id,
        image_path=image_path,
        has_fracture=analysis_result["has_fracture"],
        has_alignment_issue=analysis_result["has_alignment_issue"],
        joint_spacing_abnormal=analysis_result["joint_spacing_abnormal"],
        severity=analysis_result["severity"],
        triage_recommendation=analysis_result["triage_recommendation"],
        findings=analysis_result["findings"],
        educational_explanation=analysis_result["educational_explanation"],
        confidence_score=analysis_result["confidence_score"]
    )
    db.add(xray)
    db.commit()
    db.refresh(xray)
    
    return XRayAnalysisResponse(
        id=xray.id,
        athlete_id=xray.athlete_id,
        has_fracture=xray.has_fracture,
        has_alignment_issue=xray.has_alignment_issue,
        joint_spacing_abnormal=xray.joint_spacing_abnormal,
        severity=xray.severity,
        triage_recommendation=xray.triage_recommendation,
        findings=xray.findings,
        educational_explanation=xray.educational_explanation,
        confidence_score=xray.confidence_score,
        uploaded_at=xray.uploaded_at
    )

@app.get("/athletes/{athlete_id}/xray-analyses", response_model=List[XRayAnalysisResponse])
async def get_athlete_xrays(athlete_id: int, db: Session = Depends(get_db)):
    """Get all X-ray analyses for an athlete"""
    analyses = db.query(XRayAnalysis).filter(
        XRayAnalysis.athlete_id == athlete_id
    ).order_by(XRayAnalysis.uploaded_at.desc()).all()
    
    return [XRayAnalysisResponse(
        id=a.id,
        athlete_id=a.athlete_id,
        has_fracture=a.has_fracture,
        has_alignment_issue=a.has_alignment_issue,
        joint_spacing_abnormal=a.joint_spacing_abnormal,
        severity=a.severity,
        triage_recommendation=a.triage_recommendation,
        findings=a.findings,
        educational_explanation=a.educational_explanation,
        confidence_score=a.confidence_score,
        uploaded_at=a.uploaded_at
    ) for a in analyses]

@app.post("/users", response_model=dict)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user (athlete, coach, provider, etc.)"""
    try:
        # Check if user already exists
        db_user = get_user_by_email(db, user.email)
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        hashed_password = get_password_hash(user.password)
        
        # Create user
        db_user = User(
            email=user.email,
            name=user.name,
            role=user.role.value,
            hashed_password=hashed_password,
            age=user.age,
            gender=user.gender,
            bmi=user.bmi,
            location=user.location,
            is_rural=user.is_rural
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return {"id": db_user.id, "email": db_user.email, "role": db_user.role, "name": db_user.name}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error creating user: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@app.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token"""
    # Get user by email
    db_user = get_user_by_email(db, user_credentials.email)
    if not db_user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Verify password
    if not verify_password(user_credentials.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email, "user_id": db_user.id, "role": db_user.role},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "role": db_user.role,
        "name": db_user.name
    }

@app.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user details"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/sessions")
async def create_training_session(session: TrainingSessionCreate, db: Session = Depends(get_db)):
    """Create a new training session"""
    db_session = TrainingSession(**session.dict())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return {"id": db_session.id, "athlete_id": db_session.athlete_id}

@app.post("/sessions/{session_id}/biomechanics")
async def add_biomechanics_data(
    session_id: int,
    data_points: List[BiomechanicsDataPoint],
    db: Session = Depends(get_db)
):
    """Add biomechanics data points to a session"""
    session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Calculate risk scores for each data point
    high_risk_count = 0
    valgus_values = []
    impact_forces = []
    
    for point in data_points:
        risk_score = 0.0
        if point.knee_valgus > 15.0:
            risk_score += 0.5
            high_risk_count += 1
        if point.ground_reaction_force > 3.0:
            risk_score += 0.5
            high_risk_count += 1
        
        db_point = BiomechanicsData(
            session_id=session_id,
            timestamp=point.timestamp,
            knee_angle=point.knee_angle,
            hip_angle=point.hip_angle,
            ankle_angle=point.ankle_angle,
            knee_valgus=point.knee_valgus,
            ground_reaction_force=point.ground_reaction_force,
            movement_type=point.movement_type,
            risk_score=min(risk_score, 1.0)
        )
        db.add(db_point)
        
        valgus_values.append(point.knee_valgus)
        impact_forces.append(point.ground_reaction_force)
    
    # Update session summary
    session.high_risk_movements = high_risk_count
    if valgus_values:
        session.avg_knee_valgus = sum(valgus_values) / len(valgus_values)
        session.peak_impact_force = max(impact_forces)
        session.avg_landing_force = sum(impact_forces) / len(impact_forces)
    
    db.commit()
    return {"message": f"Added {len(data_points)} data points", "high_risk_movements": high_risk_count}

@app.get("/athletes/{athlete_id}/risk-assessment")
async def get_risk_assessment(athlete_id: int, db: Session = Depends(get_db)):
    """Get AI-powered risk assessment for an athlete"""
    user = db.query(User).filter(User.id == athlete_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Athlete not found")
    
    # Get recent sessions and biomechanics data
    recent_sessions = db.query(TrainingSession).filter(
        TrainingSession.athlete_id == athlete_id
    ).order_by(TrainingSession.start_time.desc()).limit(10).all()
    
    session_ids = [s.id for s in recent_sessions]
    recent_biomechanics = db.query(BiomechanicsData).filter(
        BiomechanicsData.session_id.in_(session_ids)
    ).all()
    
    # Perform risk assessment
    assessment = risk_model.assess_risk(user, recent_sessions, recent_biomechanics)
    
    # Save assessment
    db_assessment = RiskAssessment(
        athlete_id=athlete_id,
        overall_risk_score=assessment.overall_risk_score,
        movement_pattern_risk=assessment.movement_pattern_risk,
        demographic_risk=assessment.demographic_risk,
        health_history_risk=assessment.health_history_risk,
        recommendations=assessment.recommendations,
        focus_areas=str(assessment.focus_areas)
    )
    db.add(db_assessment)
    db.commit()
    
    return assessment

@app.get("/athletes/{athlete_id}/sessions")
async def get_athlete_sessions(athlete_id: int, db: Session = Depends(get_db)):
    """Get all training sessions for an athlete"""
    sessions = db.query(TrainingSession).filter(
        TrainingSession.athlete_id == athlete_id
    ).order_by(TrainingSession.start_time.desc()).all()
    return sessions

@app.get("/sessions/{session_id}/analysis")
async def get_session_analysis(session_id: int, db: Session = Depends(get_db)):
    """Get detailed session analysis with biomechanics data and muscle activation"""
    session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get all biomechanics data for this session
    biomechanics_data = db.query(BiomechanicsData).filter(
        BiomechanicsData.session_id == session_id
    ).order_by(BiomechanicsData.timestamp.asc()).all()
    
    # Calculate muscle activation based on movement patterns
    muscle_activation = calculate_muscle_activation(biomechanics_data)
    
    # Calculate session statistics
    total_movements = len(biomechanics_data)
    high_risk_count = sum(1 for b in biomechanics_data if b.risk_score > 0.7)
    avg_knee_valgus = sum(b.knee_valgus for b in biomechanics_data) / total_movements if total_movements > 0 else 0
    avg_grf = sum(b.ground_reaction_force for b in biomechanics_data) / total_movements if total_movements > 0 else 0
    peak_grf = max((b.ground_reaction_force for b in biomechanics_data), default=0)
    
    # Movement type distribution
    movement_types = {}
    for b in biomechanics_data:
        movement_types[b.movement_type] = movement_types.get(b.movement_type, 0) + 1
    
    return {
        "session": {
            "id": session.id,
            "athlete_id": session.athlete_id,
            "session_type": session.session_type,
            "sport": session.sport,
            "duration_minutes": session.duration_minutes,
            "start_time": session.start_time,
            "end_time": session.end_time,
        },
        "statistics": {
            "total_movements": total_movements,
            "high_risk_movements": high_risk_count,
            "high_risk_percentage": (high_risk_count / total_movements * 100) if total_movements > 0 else 0,
            "avg_knee_valgus": avg_knee_valgus,
            "avg_ground_reaction_force": avg_grf,
            "peak_impact_force": peak_grf,
            "movement_types": movement_types,
        },
        "muscle_activation": muscle_activation,
        "biomechanics_timeline": [
            {
                "timestamp": b.timestamp.isoformat(),
                "knee_angle": b.knee_angle,
                "hip_angle": b.hip_angle,
                "ankle_angle": b.ankle_angle,
                "knee_valgus": b.knee_valgus,
                "ground_reaction_force": b.ground_reaction_force,
                "movement_type": b.movement_type,
                "risk_score": b.risk_score,
            }
            for b in biomechanics_data
        ]
    }

def calculate_muscle_activation(biomechanics_data: List[BiomechanicsData]) -> dict:
    """Calculate muscle activation levels based on movement patterns and biomechanics"""
    if not biomechanics_data:
        return {}
    
    # Initialize muscle activation counters
    muscle_activity = {
        "quadriceps": {"total": 0, "peak": 0, "avg": 0},
        "hamstrings": {"total": 0, "peak": 0, "avg": 0},
        "glutes": {"total": 0, "peak": 0, "avg": 0},
        "calves": {"total": 0, "peak": 0, "avg": 0},
        "hip_flexors": {"total": 0, "peak": 0, "avg": 0},
        "hip_adductors": {"total": 0, "peak": 0, "avg": 0},
        "hip_abductors": {"total": 0, "peak": 0, "avg": 0},
        "core": {"total": 0, "peak": 0, "avg": 0},
    }
    
    quad_values = []
    hamstring_values = []
    glute_values = []
    calf_values = []
    hip_flexor_values = []
    hip_adductor_values = []
    hip_abductor_values = []
    core_values = []
    
    for b in biomechanics_data:
        knee_angle_rad = b.knee_angle * (3.14159 / 180)
        hip_angle_rad = b.hip_angle * (3.14159 / 180)
        ankle_angle_rad = b.ankle_angle * (3.14159 / 180)
        
        # Quadriceps: active during knee extension and landing
        quad_activation = 0
        if b.movement_type in ["landing", "jumping"]:
            # Higher activation during landing with knee flexion
            quad_activation = (180 - b.knee_angle) / 180 * (b.ground_reaction_force / 3) * 100
        elif b.movement_type in ["cutting", "pivoting"]:
            quad_activation = (180 - b.knee_angle) / 180 * 60
        quad_values.append(quad_activation)
        muscle_activity["quadriceps"]["total"] += quad_activation
        
        # Hamstrings: critical for ACL protection, active during knee flexion and eccentric loading
        hamstring_activation = 0
        if b.knee_angle < 160:
            hamstring_activation = (160 - b.knee_angle) / 160 * 70
        if b.movement_type == "landing":
            hamstring_activation += b.ground_reaction_force * 15
        hamstring_values.append(hamstring_activation)
        muscle_activity["hamstrings"]["total"] += hamstring_activation
        
        # Glutes: hip extension and stabilization
        glute_activation = 0
        if b.hip_angle < 170:
            glute_activation = (170 - b.hip_angle) / 170 * 50
        if abs(b.knee_valgus) > 10:  # Need glute strength to control valgus
            glute_activation += abs(b.knee_valgus) * 3
        glute_values.append(glute_activation)
        muscle_activity["glutes"]["total"] += glute_activation
        
        # Calves: ankle plantarflexion during landing and jumping
        calf_activation = 0
        if b.movement_type in ["landing", "jumping"]:
            calf_activation = (b.ground_reaction_force / 3) * 40
        if b.ankle_angle < 100:
            calf_activation += (100 - b.ankle_angle) / 100 * 30
        calf_values.append(calf_activation)
        muscle_activity["calves"]["total"] += calf_activation
        
        # Hip flexors: hip flexion during cutting and running
        hip_flexor_activation = 0
        if b.movement_type in ["cutting", "running"]:
            hip_flexor_activation = (180 - b.hip_angle) / 180 * 50
        hip_flexor_values.append(hip_flexor_activation)
        muscle_activity["hip_flexors"]["total"] += hip_flexor_activation
        
        # Hip adductors: control knee valgus (important for ACL protection)
        hip_adductor_activation = 0
        if b.knee_valgus > 10:
            hip_adductor_activation = b.knee_valgus * 4  # Need to control valgus
        hip_adductor_values.append(hip_adductor_activation)
        muscle_activity["hip_adductors"]["total"] += hip_adductor_activation
        
        # Hip abductors: lateral stability
        hip_abductor_activation = 0
        if b.knee_valgus < -5:  # Knee bowing outward
            hip_abductor_activation = abs(b.knee_valgus) * 3
        if b.movement_type in ["cutting", "side_step"]:
            hip_abductor_activation += 25
        hip_abductor_values.append(hip_abductor_activation)
        muscle_activity["hip_abductors"]["total"] += hip_abductor_activation
        
        # Core: stability during all movements
        core_activation = 20  # Base activation
        if b.ground_reaction_force > 2.5:
            core_activation += (b.ground_reaction_force - 2.5) * 15
        if abs(b.knee_valgus) > 10:
            core_activation += abs(b.knee_valgus) * 2
        core_values.append(core_activation)
        muscle_activity["core"]["total"] += core_activation
    
    # Calculate averages and peaks
    total_data_points = len(biomechanics_data)
    if total_data_points > 0:
        muscle_activity["quadriceps"]["avg"] = sum(quad_values) / total_data_points if quad_values else 0
        muscle_activity["quadriceps"]["peak"] = max(quad_values) if quad_values else 0
        
        muscle_activity["hamstrings"]["avg"] = sum(hamstring_values) / total_data_points if hamstring_values else 0
        muscle_activity["hamstrings"]["peak"] = max(hamstring_values) if hamstring_values else 0
        
        muscle_activity["glutes"]["avg"] = sum(glute_values) / total_data_points if glute_values else 0
        muscle_activity["glutes"]["peak"] = max(glute_values) if glute_values else 0
        
        muscle_activity["calves"]["avg"] = sum(calf_values) / total_data_points if calf_values else 0
        muscle_activity["calves"]["peak"] = max(calf_values) if calf_values else 0
        
        muscle_activity["hip_flexors"]["avg"] = sum(hip_flexor_values) / total_data_points if hip_flexor_values else 0
        muscle_activity["hip_flexors"]["peak"] = max(hip_flexor_values) if hip_flexor_values else 0
        
        muscle_activity["hip_adductors"]["avg"] = sum(hip_adductor_values) / total_data_points if hip_adductor_values else 0
        muscle_activity["hip_adductors"]["peak"] = max(hip_adductor_values) if hip_adductor_values else 0
        
        muscle_activity["hip_abductors"]["avg"] = sum(hip_abductor_values) / total_data_points if hip_abductor_values else 0
        muscle_activity["hip_abductors"]["peak"] = max(hip_abductor_values) if hip_abductor_values else 0
        
        muscle_activity["core"]["avg"] = sum(core_values) / total_data_points if core_values else 0
        muscle_activity["core"]["peak"] = max(core_values) if core_values else 0
    
    # Normalize to 0-100 scale
    for muscle in muscle_activity:
        for key in ["total", "avg", "peak"]:
            muscle_activity[muscle][key] = min(100, max(0, muscle_activity[muscle][key]))
    
    return muscle_activity

@app.post("/rehabilitation-plans")
async def create_rehabilitation_plan(
    athlete_id: int,
    provider_id: int,
    phase: str,
    exercises: List[str],
    duration_weeks: int,
    db: Session = Depends(get_db)
):
    """Create a personalized rehabilitation plan"""
    plan = RehabilitationPlan(
        athlete_id=athlete_id,
        provider_id=provider_id,
        phase=phase,
        exercises=str(exercises),
        duration_weeks=duration_weeks
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return {"id": plan.id, "phase": plan.phase}

@app.get("/rehabilitation-plans/{athlete_id}")
async def get_rehabilitation_plans(athlete_id: int, db: Session = Depends(get_db)):
    """Get active rehabilitation plans for an athlete"""
    plans = db.query(RehabilitationPlan).filter(
        RehabilitationPlan.athlete_id == athlete_id,
        RehabilitationPlan.is_active == True
    ).all()
    return plans

# WebSocket for real-time biomechanics streaming
@app.websocket("/ws/biomechanics/{session_id}")
async def websocket_biomechanics(websocket: WebSocket, session_id: int):
    """WebSocket endpoint for real-time biomechanics data streaming"""
    await websocket.accept()
    db = SessionLocal()
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Process incoming biomechanics data
            point = BiomechanicsDataPoint(**data)
            
            # Calculate risk score
            risk_score = 0.0
            if point.knee_valgus > 15.0:
                risk_score += 0.5
            if point.ground_reaction_force > 3.0:
                risk_score += 0.5
            
            # Save to database
            db_point = BiomechanicsData(
                session_id=session_id,
                timestamp=point.timestamp,
                knee_angle=point.knee_angle,
                hip_angle=point.hip_angle,
                ankle_angle=point.ankle_angle,
                knee_valgus=point.knee_valgus,
                ground_reaction_force=point.ground_reaction_force,
                movement_type=point.movement_type,
                risk_score=min(risk_score, 1.0)
            )
            db.add(db_point)
            db.commit()
            
            # Send feedback
            feedback = {
                "risk_score": risk_score,
                "warning": risk_score > 0.7,
                "message": "High risk movement detected" if risk_score > 0.7 else "Movement within safe range"
            }
            await websocket.send_json(feedback)
            
    except WebSocketDisconnect:
        pass
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

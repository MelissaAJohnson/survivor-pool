from fastapi import FastAPI, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from models import Base, User, Entry, Pick, Team
from passlib.context import CryptContext

# App init
app = FastAPI()

# ✅ CORS: allow React frontend on port 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Database setup
DATABASE_URL = "sqlite:///./survivor.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(bind=engine)

# ✅ Password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ✅ Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ✅ Register a new user
@app.post("/register")
def register_user(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    #Check if user already exists
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="User already exists")
    
    #Hash the password
    hashed_pw = pwd_context.hash(password)

    #Create and save user
    user = User(email=email, hashed_password=hashed_pw)
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": f"{email} registered successfully."}

# ✅ Create a new entry for a user
@app.post("/entry")
def create_entry(
    email: str = Form(...),
    nickname: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User not found for email: {email}")
    
    entry = Entry(user_id=user.id, nickname=nickname, verified=False)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"message": f"Entry '{nickname}' created", "entry_id": entry.id}

# ✅ Submit a pick for a given entry
@app.post ("/pick")
def submit_pick(
    entry_id: int = Form(...),
    week: int = Form(...),
    team: str = Form(...),
    db: Session = Depends(get_db)
):
    entry = db.query(Entry).filter(Entry.id == entry_id).first()
    if not entry:
        return {"error": "Entry not found"}
    if not entry.verified:
        return {"error": "Entry is not verified by Admin."}
    
    existing_pick = db.query(Pick).filter_by(entry_id=entry_id, week=week).first()
    if existing_pick:
        return {"error": "Pick already submitted for this week."}
    
    pick = Pick(entry_id=entry_id, week=week, team=team)
    db.add(pick)
    db.commit()
    return {"message": f"Pick submitted for Week {week}"}

@app.get("/admin")
def admin_dashboard(db: Session = Depends(get_db)):
    users = db.query(User).all()
    result = []
    for user in users:
        user_data = {
            "email": user.email,
            "entries": []
        }
        for entry in user.entries:
            entry_data = {
                "id": entry.id,
                "nickname": entry.nickname,
                "verified": entry.verified,
                "picks": [{"week": pick.week, "team": pick.team} for pick in entry.picks]
            }
            user_data["entries"].append(entry_data)
        result.append(user_data)
    return result

@app.post("/login")
def login_user(email: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Email not registered")
    return {"message": f"Welcome back, {email}!"}

@app.post("/verify-entry")
def verify_entry(entry_id: int = Form(...), db: Session = Depends(get_db)):
    entry = db.query(Entry).filter(Entry.id == entry_id).first()
    if not entry:
        return {"error": "Entry not found"}
    entry.verified = True
    db.commit()
    return {"message": f"Entry '{entry.nickname}' verified"}

@app.get("/teams")
def list_teams(db: Session = Depends(get_db)):
    return db.query(Team).all()

@app.post("/teams")
def create_team(name: str = Form(...), db: Session = Depends(get_db)):
    if db.query(Team).filter_by(name=name).first():
        raise HTTPException(status_code=400, detail="Team already exists")
    team = Team(name=name)
    db.add(team)
    db.commit()
    db.refresh(team)
    return {"message": f"Team '{name}' created", "id": team.id}

@app.put("/teams/{team_id}")
def update_team(team_id: int, name: str = Form(...), db: Session = Depends(get_db)):
    team = db.query(Team).filter_by(id=team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    team.name = name
    db.commit()
    return {"message": f"Team {team_id} updated to '{name}'"}

@app.delete("/teams/{team_id}")
def delete_team(team_id: int, db: Session = Depends(get_db)):
    team = db.query(Team).filter_by(id=team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    db.delete(team)
    db.commit()
    return {"message": f"Team {team_id} deleted"}

from fastapi import FastAPI, Form, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker, Session
from models import Base, User, Entry, Pick, Team, TeamResult
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt, JWTError
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from dotenv import load_dotenv
import os
load_dotenv()

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM")
FRONTEND_URL = os.getenv("FRONTEND_URL")

#JWT Setup
SECRET_KEY = "super-secret-key"
ALGORITHM = "HS256"

# ✅ Password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

#Hash the password
def hash_password(password: str):
    return pwd_context.hash(password)

#Verify password
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

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

# ✅ Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#Role-based decorators
def require_role(required_roles: list):
    def role_checker(request: Request, db: Session = Depends(get_db)):
        email = request.headers.get("X-User-Email")  # Or from session, token, etc.
        if not email:
            raise HTTPException(status_code=401, detail="Missing user info")

        user = db.query(User).filter_by(email=email).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if user.role not in required_roles:
            raise HTTPException(status_code=403, detail="Unauthorized")
        return user
    return role_checker

#Send email verification
def send_verification_email(to_email, token):
    confirm_url = f"{token}"
    message = Mail(
        from_email=EMAIL_FROM,
        to_emails=to_email,
        subject="Confirm your Survivor Pool account",
        html_content=f"""
        <p>Click the link below to confirm your email:</p>
        <a href="{confirm_url}">Confirm Email</a>
        """,
    )
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        sg.send(message)
        print(f"✅ Email sent to {to_email}")
    except Exception as e:
        print(f"❌ Email error: {e}")

# ✅ Register a new user
@app.post("/register")
def register_user(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    #Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        return JSONResponse(status_code=400, content={"error": "User already exists"})
    
    hashed_pw = hash_password(password)
    new_user = User(email=email, hashed_password=hashed_pw, verified=False, role="player")
    db.add(new_user)
    db.commit()

    #Generate token for email confirmation
    token_data = {"sub": email}
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

    confirm_url = f"http://localhost:8000/confirm?token={token}"
    send_verification_email(email, token)

    print("Email confirmation link", confirm_url)

    return {
        "message": "User registered successfully. Please confirm your email.",
        "confirm_url": confirm_url
    }

# ✅ Confirm user
@app.get("/confirm")
def confirm_email(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")

        if not email:
            return JSONResponse(status_code=400, content={"error": "Invalid token"})

        user = db.query(User).filter(User.email == email).first()
        if not user:
            return JSONResponse(status_code=404, content={"error": "User not found"})

        if user.verified:
            return RedirectResponse(url=f"{FRONTEND_URL}/?confirmed=1", status_code=302)

        user.verified = True
        db.commit()

        return RedirectResponse(url=f"{FRONTEND_URL}/?confirmed=1", status_code=302)

    except JWTError as e:
        return JSONResponse(status_code=400, content={"error": f"Invalid or expired token: {str(e)}"})

    except Exception as e:
        print("❌ Internal error:", str(e))
        return JSONResponse(status_code=500, content={"error": "Internal server error"})
    
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

@app.get("/entries")
def get_user_entries(email: str, db: Session = Depends(get_db)):
    email = email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    entries = db.query(Entry).filter(Entry.user_id == user.id).all()
    return [
        {
            "id": e.id,
            "nickname": e.nickname,
            "verified": e.verified
        }
        for e in entries
    ]

# ✅ Manage picks
@app.post("/pick")
def submit_pick(
    entry_id: int = Form(...),
    week: int = Form(...),
    team: str = Form(...),
    db: Session = Depends(get_db)
):
    # Confirm entry exists
    try:
        entry = db.query(Entry).filter(Entry.id == entry_id).first()
        if not entry:
            raise HTTPException(status_code=404, detail="Entry not found")

        if not entry.verified:
            raise HTTPException(status_code=403, detail="Entry is not verified by Admin.")

        # Check for existing pick
        existing_pick = db.query(Pick).filter_by(entry_id=entry_id, week=week).first()
        if existing_pick:
            raise HTTPException(status_code=400, detail="Pick already submitted for this week.")

        # Create new pick
        pick = Pick(entry_id=entry_id, week=week, team=team)
        db.add(pick)
        db.commit()

        return {"message": f"✅ Pick submitted for Week {week} — {team}"}
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/picks")
def get_user_picks(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    picks = (
        db.query(Pick, Entry)
        .join(Entry, Pick.entry_id == Entry.id)
        .filter(Entry.user_id == user.id)
        .all()
    )

    return [
        {
            "id": pick.id,
            "entry_id": entry.id,
            "entry_nickname": entry.nickname,
            "week": pick.week,
            "team": pick.team
        }
        for pick, entry in picks
    ]

@app.put("/pick/{pick_id}")
def update_pick(
    pick_id: int,
    week: int = Form(...),
    team: str = Form(...),
    db: Session = Depends(get_db)
):
    pick = db.query(Pick).filter(Pick.id == pick_id).first()
    if not pick:
        raise HTTPException(status_code=404, detail="Pick not found")
    
    # Deadline Check
    now = datetime.utcnow()
    deadline = get_week_deadline(week)

    if now > deadline:
        raise HTTPException(status_code=403, detail=f"Week {week} is locked - picks cannot be edited after {deadline} UTC")
    
    pick.week = week
    pick.team = team
    db.commit()
    return {"message": f"✅ Pick updated for Entry {pick.entry_id}, Week {week}"}

# ✅ Show Users and their Entries
@app.get("/admin")
def admin_dashboard(db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["manager", "admin"]))):
    users = db.query(User).all()
    result = []
    for user in users:
        user_data = {
            "email": user.email,
            "role": user.role,
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

# ✅ Require users to Login
@app.post("/login")
def login_user(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter_by(email=email).first()

    if not user:
        return JSONResponse(status_code=400, content={"error": "Invalid email or password"})

    if not verify_password(password, user.hashed_password):
        return JSONResponse(status_code=400, content={"error": "Invalid email or password"})

    if not user.verified:
        return JSONResponse(status_code=403, content={"error": "Email not confirmed"})

    return {"message": "Login successful", "email": user.email, "role": user.role}

# ✅ Allow Adminstrator to verify user's entry
@app.post("/verify-entry")
def verify_entry(
        entry_id: int = Form(...), 
        user = Depends(require_role(["manager", "admin"])),
        db: Session = Depends(get_db)
    ):
    entry = db.query(Entry).filter(Entry.id == entry_id).first()
    if not entry:
        return {"error": "Entry not found"}
    entry.verified = True
    db.commit()
    return {"message": f"Entry '{entry.nickname}' verified"}

# Allow Administrator to update roles
@app.get("/admin/users")
def user_admin_dashboard(
    user = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    return [{"email": u.email, "role": u.role} for u in users]

@app.post("/update-role")
def update_user_role(
    email: str = Form(...),
    role: str = Form(...),
    user = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    user_to_update = db.query(User).filter(User.email == email).first()
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")
    
    if role not in ["player", "manager", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    user_to_update.role = role
    db.commit()
    return {"message": f"Role for {email} set to {role}"}

# ✅ Manage NFL Teams
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

# Manage deadline
def get_week_deadline(week: int) -> datetime:
    base_deadline = datetime(2025, 6, 7, 18, 0)
    return base_deadline + timedelta(weeks=week -1)

# ✅ Game Results
@app.post("/team-result")
def set_team_result(
    week: int = Form(...),
    team: str = Form(...),
    result: str = Form(...),
    db: Session = Depends(get_db),
    user = Depends(require_role(["admin"]))
):
    if result not in ["win", "loss"]:
        raise HTTPException(status_code=400, detail="Result must be 'win' or 'loss")
    
    #Check if already exists
    existing = db.query(TeamResult).filter_by(week=week, team=team).first()
    if existing:
        existing.result = result
    else:
        result_obj = TeamResult(week=week, team=team, result=result)
        db.add(result_obj)
        db.commit()
        db.refresh(result_obj)
        return {"message": f"Result for {team} in Week {week} set to {result_obj.result}"}

@app.get("/team-results")
def get_team_results(db: Session = Depends(get_db)):
    results = db.query(TeamResult).all()
    return [
        {
            "id": r.id,
            "week": r.week,
            "team": r.team,
            "result": r.result
        }
        for r in results
    ]
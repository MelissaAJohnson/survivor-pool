# models.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from database import Base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    verified = Column(Boolean, default=False)
    role = Column(String, default="player")
    entries = relationship("Entry", back_populates="user")

class Entry(Base):
    __tablename__ = "entries"

    id = Column(Integer, primary_key=True)
    nickname = Column(String)
    verified = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="entries")
    picks = relationship("Pick", back_populates="entry")

class Pick(Base):
    __tablename__ = "picks"

    id = Column(Integer, primary_key=True)
    entry_id = Column(Integer, ForeignKey("entries.id"), nullable=False)
    week = Column(Integer, nullable=False)
    team = Column(String, nullable=False)

    entry = relationship("Entry", back_populates="picks")

class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)

class TeamResult(Base):
    __tablename__ = "team_results"

    id = Column(Integer, primary_key=True, index=True)
    week = Column(Integer, nullable=False)
    team = Column(String, nullable=False)
    result = Column(String, nullable=False)
# models.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    entries = relationship("Entry", back_populates="user")

class Entry(Base):
    __tablename__ = "entries"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    nickname = Column(String)
    verified = Column(Boolean, default=False)

    user = relationship("User", back_populates="entries")
    picks = relationship("Pick", back_populates="entry")

class Pick(Base):
    __tablename__ = "picks"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("entries.id"))
    week = Column(Integer, nullable=False)
    team = Column(String, nullable=False)

    entry = relationship("Entry", back_populates="picks")

class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
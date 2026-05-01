from sqlalchemy.orm import Session

from models import User


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_by_id(db: Session, user_id: str) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def update_password_hash(db: Session, user: User, new_hash: str) -> None:
    user.password_hash = new_hash
    db.commit()

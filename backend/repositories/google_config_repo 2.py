from typing import Optional

from sqlalchemy.orm import Session

from models import GoogleConfig


def find(db: Session) -> Optional[GoogleConfig]:
    return db.query(GoogleConfig).filter(GoogleConfig.id == 1).first()


def upsert(db: Session, fields: dict) -> GoogleConfig:
    config = find(db)
    if config is None:
        config = GoogleConfig(id=1, **fields)
        db.add(config)
    else:
        for key, value in fields.items():
            setattr(config, key, value)
    db.commit()
    db.refresh(config)
    return config

from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy import inspect
from sqlalchemy.ext.declarative import declarative_base
from db.connection import get_session

Base = declarative_base()

class ORMModel:
    # Shared DB session from singleton
    db = get_session()
    def __init__(self, **kwargs):
        # Let SQLAlchemy handle known DB fields
        db_columns = {c.key for c in self.__table__.columns}
        db_kwargs = {k: v for k, v in kwargs.items() if k in db_columns}
        extra_kwargs = {k: v for k, v in kwargs.items() if k not in db_columns}

        # Call SQLAlchemy's __init__() for DB fields
        super().__init__(**db_kwargs)

        # Set non-DB fields
        for k, v in extra_kwargs.items():
            setattr(self, k, v)
                            
    def save(self):
        self.db.add(self)
        self.db.commit()
        self.db.refresh(self)
        return self

    def flush(self):
        self.db.add(self)
        self.db.flush()  # Pushes to DB session but doesn't commit
        return self

    @classmethod
    def create(cls, **kwargs) -> 'ORMModel':
        obj = cls(**kwargs)
        cls.db.add(obj)
        cls.db.commit()
        cls.db.refresh(obj)
        return obj

    @classmethod
    def get_by_id(cls, id) -> 'ORMModel':
        return cls.db.query(cls).get(id)

    @classmethod
    def get_all_by_filter(cls, **filters) -> list['ORMModel']:
        return cls.db.query(cls).filter_by(**filters).all()

    def update(self, **kwargs) -> 'ORMModel':
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.db.commit()
        self.db.refresh(self)
        return self

    def delete(self):
        self.db.delete(self)
        self.db.commit()

    def as_dict(self):
        return {
            c.key: getattr(self, c.key)
            for c in inspect(self).mapper.column_attrs
        }

    @classmethod
    def exists(cls, **filters):
        return cls.db.query(cls).filter_by(**filters).first() is not None

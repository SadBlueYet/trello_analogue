from abc import ABC, abstractmethod
from http.client import HTTPException
from typing import Any, Sequence

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException


class BaseRepository(ABC):
    @abstractmethod
    async def get_all(self, **kwargs):
        pass
    
    @abstractmethod
    async def get_one(self, **kwargs):
        pass
    
    @abstractmethod
    async def create(self, data: dict):
        pass


class SqlAlchemyRepository(BaseRepository):
    def __init__(self, model: Any, session: AsyncSession):
        self.model = model
        self.session = session
    
    async def get_all(self, **kwargs) -> Sequence[Any]:
        """
        Получает все данные из таблицы, которые подходят под фильтры.
        """
        try:
            query = select(self.model).filter_by(**kwargs)
            return (await self.session.execute(query)).scalars().all()
        except Exception as e:
            
            raise HTTPException(status_code=400, detail=f"Invalid filter: {e}")

    async def get_one(self, **kwargs):
        """
        Получает одну запись из таблицы, которая подходит под фильтры.
        """
        try:
            query = select(self.model).filter_by(**kwargs)
            return (await self.session.execute(query)).scalar_one_or_none()
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid filter: {kwargs}")

    async def create(self, data: dict):
        try:
            model = self.model(**data)
            self.session.add(model)
            await self.session.commit()
            await self.session.refresh(model)
            return model
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid data: {e}")

    async def update(self, model: Any, update_data: dict):
        try:
            for field, value in update_data.items():
                setattr(model, field, value)
            await self.session.commit()
            await self.session.refresh(model)
            return model
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid data: {e}")
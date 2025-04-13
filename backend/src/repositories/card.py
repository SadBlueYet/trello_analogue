from typing import List

from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.models import Card, BoardList
from src.schemas.card import CardCreate, CardUpdate
from .base import SqlAlchemyRepository


class CardRepository(SqlAlchemyRepository):
    model: Card

    def __init__(self, session: AsyncSession):
        super().__init__(Card, session)

    async def get_list_cards(self, list_id: int) -> List[Card]:
        """
        Get all cards in a list.
        """
        result = await self.session.execute(
            select(Card)
            .options(joinedload(Card.assignee))
            .where(Card.list_id == list_id)
            .order_by(Card.position)
        )
        cards = result.scalars().all()
        return cards

    async def create_card(self, card_in: CardCreate) -> Card:
        """
        Create a new card.
        """
        # Get the current highest position in the list
        result = await self.session.execute(
            select(Card).where(Card.list_id == card_in.list_id).order_by(Card.position.desc()).limit(1)
        )
        last_card = result.scalar_one_or_none()
        new_position = (last_card.position + 1) if last_card else 0

        # Получаем информацию о списке чтобы знать ID доски
        list_result = await self.session.execute(select(BoardList).where(BoardList.id == card_in.list_id))
        list_obj = list_result.scalar_one()

        sequence_name = f"task_seq_board_{list_obj.board_id}"

        # Создаем последовательность, если её нет
        await self.session.execute(text(f"CREATE SEQUENCE IF NOT EXISTS {sequence_name} START 1"))

        # Получаем следующее значение ID
        card_id = (await self.session.execute(text(f"SELECT nextval('{sequence_name}')"))).scalar()

        db_card = Card(
            card_id=card_id,
            title=card_in.title,
            description=card_in.description,
            list_id=card_in.list_id,
            position=new_position,
        )
        self.session.add(db_card)
        await self.session.commit()
        await self.session.refresh(db_card)
        return db_card
    
    async def update_card(self, db_card: Card, card_in: CardUpdate) -> Card:
        """
        Update a card.
        """
        update_data = card_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(db_card, field, value)

        await self.session.commit()
        await self.session.refresh(db_card)
        return db_card
    
    async def delete_card(self, card_id: int) -> None:
        """
        Delete a card.

    The task numbers (LA-XXX) remain consistent for existing cards.
    Next task number after deletion will continue the sequence.
    """
        card = await self.get_card(card_id)
        if card:
            stmt = (
                update(Card)
                .where(Card.list_id == card.list_id and Card.position > card.position)
                .values(position=card.position)
            )

        await self.session.execute(stmt)

        await self.session.delete(card)
        await self.session.commit()

    async def move_card(self, card_id: int, target_list_id: int, new_position: int) -> Card | None:
        """
        Move a card to a new position and/or list.
        """
        card = await self.get_one(id=card_id)
        if not card:
            return None

        old_position = card.position
        old_list_id = card.list_id

        if old_list_id != target_list_id:
            # Освобождаем место в старом списке
            await self.session.execute(
                update(Card)
                .where((Card.list_id == old_list_id) & (Card.position > old_position))
                .values(position=Card.position - 1)
            )

            # Сдвигаем позиции в новом списке
            await self.session.execute(
                update(Card)
                .where((Card.list_id == target_list_id) & (Card.position >= new_position))
                .values(position=Card.position + 1)
            )

            card.list_id = target_list_id

        else:
            if old_position < new_position:
                # Двигаем вперёд
                await self.session.execute(
                    update(Card)
                    .where((Card.list_id == old_list_id) & (Card.position > old_position) & (Card.position <= new_position))
                    .values(position=Card.position - 1)
                )
            elif old_position > new_position:
                # Двигаем назад
                await self.session.execute(
                    update(Card)
                    .where((Card.list_id == old_list_id) & (Card.position >= new_position) & (Card.position < old_position))
                    .values(position=Card.position + 1)
                )

        card.position = new_position
        await self.session.commit()

        return card

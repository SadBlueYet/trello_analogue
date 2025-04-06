import logging
from typing import List, Optional

from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.board_list import BoardList
from app.models.card import Card
from app.schemas.card import CardCreate, CardUpdate


async def get_card(db: AsyncSession, card_id: int) -> Optional[Card]:
    """
    Get a card by ID.
    """
    result = await db.execute(select(Card).where(Card.id == card_id))
    return result.scalar_one_or_none()


async def get_list_cards(db: AsyncSession, list_id: int) -> List[Card]:
    """
    Get all cards in a list.
    """
    result = await db.execute(
        select(Card)
        .options(joinedload(Card.assignee))  # Eagerly load the assignee relationship
        .where(Card.list_id == list_id)
        .order_by(Card.position)
    )
    cards = result.scalars().all()
    return cards


async def create_card(db: AsyncSession, card_in: CardCreate) -> Card:
    """
    Create a new card.
    """
    # Get the current highest position in the list
    result = await db.execute(
        select(Card).where(Card.list_id == card_in.list_id).order_by(Card.position.desc()).limit(1)
    )
    last_card = result.scalar_one_or_none()
    new_position = (last_card.position + 1) if last_card else 0

    # Получаем информацию о списке чтобы знать ID доски
    list_result = await db.execute(select(BoardList).where(BoardList.id == card_in.list_id))
    list_obj = list_result.scalar_one()

    sequence_name = f"task_seq_board_{list_obj.board_id}"

    # Создаем последовательность, если её нет
    await db.execute(text(f"CREATE SEQUENCE IF NOT EXISTS {sequence_name} START 1"))

    # Получаем следующее значение ID
    card_id = (await db.execute(text(f"SELECT nextval('{sequence_name}')"))).scalar()

    db_card = Card(
        card_id=card_id,
        title=card_in.title,
        description=card_in.description,
        list_id=card_in.list_id,
        position=new_position,
    )
    db.add(db_card)
    await db.commit()
    await db.refresh(db_card)
    return db_card


async def update_card(db: AsyncSession, db_card: Card, card_in: CardUpdate) -> Card:
    """
    Update a card.
    """
    logging.info(f"Updating card {db_card.id} with data: {card_in.model_dump(exclude_unset=True)}")
    update_data = card_in.model_dump(exclude_unset=True)

    # Explicitly handle assignee_id field to ensure it's properly set
    if "assignee_id" in update_data:
        logging.info(f"Setting assignee_id to {update_data['assignee_id']}")
        db_card.assignee_id = update_data["assignee_id"]

    # Update all other fields
    for field, value in update_data.items():
        if field != "assignee_id":  # We already handled this field
            setattr(db_card, field, value)

    await db.commit()
    await db.refresh(db_card)
    logging.info(f"Card after update: assignee_id={db_card.assignee_id}")
    return db_card


async def delete_card(db: AsyncSession, card_id: int) -> None:
    """
    Delete a card.

    The task numbers (LA-XXX) remain consistent for existing cards.
    Next task number after deletion will continue the sequence.
    """
    card = await get_card(db, card_id)
    if card:
        stmt = (
            update(Card)
            .where(Card.list_id == card.list_id and Card.position > card.position)
            .values(position=card.position)
        )

        await db.execute(stmt)

        await db.delete(card)
        await db.commit()


async def move_card(db: AsyncSession, card_id: int, target_list_id: int, new_position: int) -> Card | None:
    """
    Move a card to a new position and/or list.
    """
    card = await get_card(db, card_id)
    if not card:
        return None

    old_position = card.position
    old_list_id = card.list_id

    if old_list_id != target_list_id:
        # Освобождаем место в старом списке
        await db.execute(
            update(Card)
            .where((Card.list_id == old_list_id) & (Card.position > old_position))
            .values(position=Card.position - 1)
        )

        # Сдвигаем позиции в новом списке
        await db.execute(
            update(Card)
            .where((Card.list_id == target_list_id) & (Card.position >= new_position))
            .values(position=Card.position + 1)
        )

        card.list_id = target_list_id

    else:
        if old_position < new_position:
            # Двигаем вперёд
            await db.execute(
                update(Card)
                .where((Card.list_id == old_list_id) & (Card.position > old_position) & (Card.position <= new_position))
                .values(position=Card.position - 1)
            )
        elif old_position > new_position:
            # Двигаем назад
            await db.execute(
                update(Card)
                .where((Card.list_id == old_list_id) & (Card.position >= new_position) & (Card.position < old_position))
                .values(position=Card.position + 1)
            )

    card.position = new_position
    await db.commit()

    return card

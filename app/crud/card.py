from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
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
        .where(Card.list_id == list_id)
        .order_by(Card.position)
    )
    return result.scalars().all()


async def create_card(db: AsyncSession, card_in: CardCreate) -> Card:
    """
    Create a new card.
    """
    # Get the current highest position in the list
    result = await db.execute(
        select(Card)
        .where(Card.list_id == card_in.list_id)
        .order_by(Card.position.desc())
    )
    last_card = result.scalar_one_or_none()
    new_position = (last_card.position + 1) if last_card else 0

    db_card = Card(
        title=card_in.title,
        description=card_in.description,
        list_id=card_in.list_id,
        position=new_position
    )
    db.add(db_card)
    await db.commit()
    await db.refresh(db_card)
    return db_card


async def update_card(db: AsyncSession, db_card: Card, card_in: CardUpdate) -> Card:
    """
    Update a card.
    """
    update_data = card_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_card, field, value)
    await db.commit()
    await db.refresh(db_card)
    return db_card


async def delete_card(db: AsyncSession, card_id: int) -> None:
    """
    Delete a card.
    """
    card = await get_card(db, card_id)
    if card:
        await db.delete(card)
        await db.commit()


async def move_card(db: AsyncSession, card_id: int, target_list_id: int, new_position: int) -> Card:
    """
    Move a card to a new position and/or list.
    """
    card = await get_card(db, card_id)
    if not card:
        return None

    # If moving to a different list
    if card.list_id != target_list_id:
        # Update positions in the old list
        await db.execute(
            """
            UPDATE cards 
            SET position = position - 1 
            WHERE list_id = :list_id 
            AND position > :old_position
            """,
            {"list_id": card.list_id, "old_position": card.position}
        )

        # Update positions in the new list
        await db.execute(
            """
            UPDATE cards 
            SET position = position + 1 
            WHERE list_id = :list_id 
            AND position >= :new_position
            """,
            {"list_id": target_list_id, "new_position": new_position}
        )

        card.list_id = target_list_id
        card.position = new_position

    # If moving within the same list
    else:
        if card.position < new_position:
            # Moving forward
            await db.execute(
                """
                UPDATE cards 
                SET position = position - 1 
                WHERE list_id = :list_id 
                AND position > :old_position 
                AND position <= :new_position
                """,
                {
                    "list_id": card.list_id,
                    "old_position": card.position,
                    "new_position": new_position
                }
            )
        else:
            # Moving backward
            await db.execute(
                """
                UPDATE cards 
                SET position = position + 1 
                WHERE list_id = :list_id 
                AND position >= :new_position 
                AND position < :old_position
                """,
                {
                    "list_id": card.list_id,
                    "old_position": card.position,
                    "new_position": new_position
                }
            )

        card.position = new_position

    await db.commit()
    await db.refresh(card)
    return card 
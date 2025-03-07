from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.card import Card
from app.schemas.card import CardCreate, CardUpdate


async def get_card(db: AsyncSession, card_id: int) -> Optional[Card]:
    return await db.get(Card, card_id)


async def get_list_cards(db: AsyncSession, list_id: int) -> List[Card]:
    result = await db.execute(
        select(Card).where(Card.list_id == list_id)
    )
    return result.scalars().all()


async def create_card(db: AsyncSession, card_in: CardCreate) -> Card:
    # Get the maximum position for the list
    result = await db.execute(
        select(func.max(Card.position)).where(Card.list_id == card_in.list_id)
    )
    max_position = result.scalar() or 0
    
    db_card = Card(
        **card_in.model_dump(),
        position=max_position + 1
    )
    db.add(db_card)
    await db.commit()
    await db.refresh(db_card)
    return db_card


async def update_card(
    db: AsyncSession,
    db_card: Card,
    card_in: CardUpdate
) -> Card:
    update_data = card_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_card, field, value)
    await db.commit()
    await db.refresh(db_card)
    return db_card


async def delete_card(db: AsyncSession, card_id: int) -> bool:
    card = await get_card(db, card_id)
    if not card:
        return False
    await db.delete(card)
    await db.commit()
    return True


async def move_card(
    db: AsyncSession,
    card_id: int,
    target_list_id: int,
    new_position: int
) -> Optional[Card]:
    card = await get_card(db, card_id)
    if not card:
        return None
    
    # If moving to a different list
    if card.list_id != target_list_id:
        # Update positions in the old list
        old_list_cards = await get_list_cards(db, card.list_id)
        for c in old_list_cards:
            if c.position > card.position:
                c.position -= 1
        
        # Update positions in the new list
        new_list_cards = await get_list_cards(db, target_list_id)
        for c in new_list_cards:
            if c.position >= new_position:
                c.position += 1
        
        card.list_id = target_list_id
        card.position = new_position
    else:
        # Moving within the same list
        old_position = card.position
        list_cards = await get_list_cards(db, card.list_id)
        
        for c in list_cards:
            if old_position < new_position:
                if c.position > old_position and c.position <= new_position:
                    c.position -= 1
            else:
                if c.position >= new_position and c.position < old_position:
                    c.position += 1
        
        card.position = new_position
    
    await db.commit()
    await db.refresh(card)
    return card 
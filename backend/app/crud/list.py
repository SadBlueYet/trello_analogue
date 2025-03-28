from typing import List, Optional, Any, Coroutine
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload
from backend.app.models.board_list import BoardList
from backend.app.schemas.board import BoardListCreate, BoardListUpdate
from backend.app.schemas.list import ResponseBoardList
from backend.app.models.card import Card


async def get_list(
    db: AsyncSession, list_id: int, include_cards: bool = False
) -> Optional[BoardList]:
    query = select(BoardList)
    if include_cards:
        query = query.options(selectinload(BoardList.cards))
    query = query.where(BoardList.id == list_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_board_lists(
    db: AsyncSession, board_id: int, include_cards: bool = False
) -> List[BoardList]:
    query = select(BoardList).where(BoardList.board_id == board_id)
    if include_cards:
        # Load cards with their assignees in a single query
        query = query.options(
            selectinload(BoardList.cards).joinedload(Card.assignee)
        )
    query = query.order_by(BoardList.position)  # Order by position
    result = await db.execute(query)
    return result.scalars().all()


async def create_list(
    db: AsyncSession, list_in: BoardListCreate
) -> BoardList:
    # Get the maximum position for the board
    result = await db.execute(
        select(func.max(BoardList.position)).where(BoardList.board_id == list_in.board_id)
    )
    max_position = result.scalar() or 0
    
    # Create new list with position = max_position + 1
    list_data = list_in.model_dump()
    list_data['position'] = max_position + 1  # Override position
    
    db_list = BoardList(**list_data)
    db.add(db_list)
    await db.commit()
    await db.refresh(db_list)
    return db_list


async def update_list(
    db: AsyncSession,
    db_list: BoardList,
    list_in: BoardListUpdate
) -> BoardList:
    update_data = list_in.model_dump(exclude_unset=True)
    
    # If position is being updated, handle reordering
    if 'position' in update_data and update_data['position'] != db_list.position:
        await reorder_list(db, db_list.id, update_data['position'])
    else:
        # Update other fields
        for field, value in update_data.items():
            setattr(db_list, field, value)
        await db.commit()
        await db.refresh(db_list)
    
    return db_list


async def delete_list(db: AsyncSession, list_id: int) -> bool:
    list_obj = await get_list(db, list_id)
    if not list_obj:
        return False
    
    # Get all lists with higher positions
    query = select(BoardList).where(
        BoardList.board_id == list_obj.board_id,
        BoardList.position > list_obj.position
    )
    result = await db.execute(query)
    higher_lists = result.scalars().all()
    
    # Decrease their positions by 1
    for l in higher_lists:
        l.position -= 1
    
    await db.delete(list_obj)
    await db.commit()
    return True


async def reorder_list(
    db: AsyncSession, list_id: int, new_position: int
) -> ResponseBoardList | None:
    list_obj = await get_list(db, list_id)
    if not list_obj:
        return None
    
    # Get all lists in the same board
    board_lists = await get_board_lists(db, list_obj.board_id)
    
    # Update positions
    old_position = list_obj.position
    for l in board_lists:
        if old_position < new_position:
            if l.position > old_position and l.position <= new_position:
                l.position -= 1
        else:
            if l.position >= new_position and l.position < old_position:
                l.position += 1
    
    list_obj.position = new_position
    await db.commit()
    await db.refresh(list_obj)
    return ResponseBoardList(
        id=list_obj.id,
        title=list_obj.title,
        position=list_obj.position,
        board_id=list_obj.board_id,
    ) 
import asyncio
import logging

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import engine, SessionLocal
from app.models.card import Card
from app.models.board_list import BoardList
from app.models.board import Board

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def assign_task_numbers() -> None:
    """
    Assigns task_number to existing cards that don't have one.
    Task numbers are in format TA-XXX and are unique per board.
    """
    try:
        logger.info("Assigning task numbers to existing cards")
        
        async with AsyncSession(engine) as db:
            # Get all boards
            boards_result = await db.execute(select(Board))
            boards = boards_result.scalars().all()
            
            for board in boards:
                logger.info(f"Processing board {board.id}: {board.title}")
                
                # Get all lists for this board
                lists_result = await db.execute(
                    select(BoardList).where(BoardList.board_id == board.id)
                )
                board_lists = lists_result.scalars().all()
                
                # Get all list IDs for this board
                list_ids = [board_list.id for board_list in board_lists]
                
                if not list_ids:
                    logger.info(f"No lists found for board {board.id}")
                    continue
                
                # Get all cards for these lists
                cards_result = await db.execute(
                    select(Card)
                    .where(Card.list_id.in_(list_ids))
                    .order_by(Card.id)  # Order by ID for consistent numbering
                )
                cards = cards_result.scalars().all()
                
                if not cards:
                    logger.info(f"No cards found for board {board.id}")
                    continue
                
                # Assign sequential task numbers
                for i, card in enumerate(cards, 1):
                    if not card.task_number:
                        card.task_number = f"TA-{i:03d}"
                        logger.info(f"Assigned {card.task_number} to card {card.id} in board {board.id}")
                
                await db.commit()
                logger.info(f"Updated cards for board {board.id}")
                
        logger.info("Task number assignment completed")
    except Exception as e:
        logger.error(f"Error assigning task numbers: {e}")
        raise


async def main() -> None:
    logger.info("Initializing service")
    await assign_task_numbers()
    logger.info("Service finished initializing")


if __name__ == "__main__":
    asyncio.run(main()) 
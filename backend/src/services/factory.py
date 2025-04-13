from src.repositories import BaseRepositoryFactory
from .board import BoardService
from .list import ListService
from .user import UserService
from .board_share import BoardShareService
from .card import CardService
from .comment import CommentService


class ServiceFactory:
    def __init__(self, repo: BaseRepositoryFactory):
        self.repo = repo

    def create_board_service(self):
        return BoardService(self.repo.create_board_repository())
    
    def create_list_service(self):
        return ListService(self.repo.create_list_repository())
    
    def create_user_service(self):
        return UserService(self.repo.create_user_repository())
    
    def create_board_share_service(self):
        return BoardShareService(self.repo.create_board_share_repository())
    
    def create_card_service(self):
        return CardService(self.repo.create_card_repository())
    
    def create_comment_service(self):
        return CommentService(self.repo.create_comment_repository())

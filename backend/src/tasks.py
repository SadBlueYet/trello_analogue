import logging
import os
import smtplib as smtp
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from celery import Celery
from jinja2 import Environment, FileSystemLoader

from src.core.config import settings

celery_app = Celery("tasks", broker=settings.REDIS_DSN)
celery_app.conf.task_default_queue = "default"

# Автоматически обнаруживать задачи в этом файле
celery_app.autodiscover_tasks(["src.tasks"])

# Настраиваем Jinja2
template_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
jinja_env = Environment(loader=FileSystemLoader(template_dir))


@celery_app.task(name="app.tasks.send_email")
def send_email(
    email: str,
    username: str,
    card_title: str,
    task_id: str = "Задача",
    editor_username: str = "пользователь",
    board_id: int = 1,
):
    """
    Отправка email уведомления о изменении карточки

    Args:
        email: Email получателя
        username: Имя получателя
        card_title: Название карточки
        task_id: ID задачи (формат XX-N)
        editor_username: Имя пользователя, который внес изменения
        board_id: ID доски
    """
    try:
        # Получаем шаблон
        template = jinja_env.get_template("email_notification.html")

        # Рендерим HTML с переданными параметрами
        html_content = template.render(
            username=username,
            card_title=card_title,
            task_id=task_id,
            editor_username=editor_username,
            board_id=board_id,
            frontend_url=settings.FRONTEND_URL,
        )

        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_LOGIN
        msg["To"] = email
        msg["Subject"] = f"Обновление карточки '{card_title}' в TaskFlow"

        msg.attach(MIMEText(html_content, "html", "utf-8"))

        server = smtp.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_LOGIN, settings.SMTP_PASSWORD)

        server.sendmail(settings.SMTP_LOGIN, email, msg.as_string())
        server.quit()
        logging.info(f"Message sent to {email}")
        return True
    except Exception as e:
        logging.error(f"Error sending email: {e}")
        return False


@celery_app.task(name="app.tasks.send_comment_notification")
def send_comment_notification(
    email: str,
    username: str,
    card_title: str,
    task_id: str,
    editor_username: str,
    board_id: int,
    comment_text: str,
):
    """
    Отправка email уведомления о новом комментарии к карточке

    Args:
        email: Email получателя
        username: Имя получателя
        card_title: Название карточки
        task_id: ID задачи (формат XX-N)
        editor_username: Имя пользователя, который внес изменения
        board_id: ID доски
        comment_text: Текст комментария
    """
    try:
        # Получаем шаблон
        template = jinja_env.get_template("email_notification.html")

        # Рендерим HTML с переданными параметрами
        html_content = template.render(
            username=username,
            card_title=card_title,
            task_id=task_id,
            editor_username=editor_username,
            board_id=board_id,
            frontend_url=settings.FRONTEND_URL,
            notification_type="comment",
            comment_text=comment_text,
        )

        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_LOGIN
        msg["To"] = email
        msg["Subject"] = f"Новый комментарий к карточке '{card_title}' в TaskFlow"

        msg.attach(MIMEText(html_content, "html", "utf-8"))

        with smtp.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_LOGIN, settings.SMTP_PASSWORD)

            server.sendmail(settings.SMTP_LOGIN, email, msg.as_string())
        logging.info(f"Comment notification sent to {email}")
        return True
    except Exception as e:
        logging.error(f"Error sending comment notification: {e}")
        return False

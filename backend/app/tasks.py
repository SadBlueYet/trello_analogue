import logging
import smtplib as smtp
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from celery import Celery

from app.core.config import settings

celery_app = Celery('tasks', broker=settings.REDIS_DSN)
celery_app.conf.task_default_queue = 'default'

# Автоматически обнаруживать задачи в этом файле
celery_app.autodiscover_tasks(['app.tasks'])

html_template = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Обновление карточки в TaskFlow</title>
    <style>
        /* Основные стили */
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f0f2f5;
            margin: 0;
            padding: 0;
            color: #333;
            -webkit-font-smoothing: antialiased;
        }}
        
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }}
        
        /* Шапка письма */
        .header {{
            background-color: #2563eb;
            padding: 24px;
            text-align: center;
        }}
        
        .logo {{
            font-size: 24px;
            font-weight: 700;
            color: white;
            letter-spacing: 0.5px;
        }}
        
        /* Блок с содержимым */
        .content-wrapper {{
            padding: 32px 24px;
        }}
        
        .greeting {{
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #1e293b;
        }}
        
        .message {{
            font-size: 16px;
            line-height: 1.6;
            color: #475569;
            margin-bottom: 24px;
        }}
        
        /* Карточка с информацией */
        .card-info {{
            background-color: #f8fafc;
            border-left: 4px solid #2563eb;
            padding: 16px;
            margin-bottom: 24px;
            border-radius: 4px;
        }}
        
        .card-title {{
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 4px;
        }}
        
        .card-caption {{
            font-size: 14px;
            color: #64748b;
        }}
        
        /* Кнопка */
        .button-container {{
            text-align: center;
            margin: 24px 0;
        }}
        
        .button {{
            display: inline-block;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.3s;
        }}
        
        .button:hover {{
            background-color: #1d4ed8;
        }}
        
        /* Подвал */
        .footer {{
            background-color: #f8fafc;
            padding: 24px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }}
        
        .team-name {{
            font-weight: 600;
            color: #2563eb;
        }}
        
        /* Адаптивность для мобильных устройств */
        @media only screen and (max-width: 600px) {{
            .email-container {{
                border-radius: 0;
            }}
            
            .content-wrapper {{
                padding: 24px 16px;
            }}
            
            .greeting {{
                font-size: 18px;
            }}
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">TaskFlow</div>
        </div>
        
        <div class="content-wrapper">
            <div class="greeting">Привет, {username}!</div>
            
            <div class="message">
                Уведомляем вас о том, что карточка, за которую вы отвечаете, была изменена.
            </div>
            
            <div class="card-info">
                <div class="card-title">{card_title}</div>
                <div class="card-caption">Были внесены изменения</div>
            </div>
            
            <div class="message">
                Чтобы просмотреть изменения и управлять карточкой, пожалуйста, нажмите на кнопку ниже.
            </div>
            
            <div class="button-container">
                <a href="http://localhost" class="button">Перейти к карточке</a>
            </div>
            
            <div class="message">
                Если у вас возникли вопросы или вам нужна помощь, обратитесь к администратору проекта.
            </div>
        </div>
        
        <div class="footer">
            <p>С уважением,<br /><span class="team-name">Команда TaskFlow</span></p>
            <p>© 2025 TaskFlow. Все права защищены.</p>
        </div>
    </div>
</body>
</html>
"""

@celery_app.task(name="app.tasks.send_email")
def send_email(email: str, username: str, card_title: str):
    message = html_template.format(username=username, card_title=card_title)

    msg = MIMEMultipart()
    msg["From"] = settings.SMTP_LOGIN
    msg["To"] = email
    msg["Subject"] = f"Обновление карточки '{card_title}' в TaskFlow"

    msg.attach(MIMEText(message, "html"))

    try:
        server = smtp.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_LOGIN, settings.SMTP_PASSWORD)

        server.sendmail(settings.SMTP_LOGIN, email, msg.as_string())
        server.quit()
        logging.info(f"Сообщение успешно отправлено на {email}")
        return True
    except Exception as e:
        logging.info(f"Ошибка при отправке email: {e}")
        return False


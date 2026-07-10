from __future__ import annotations

import logging
import smtplib
from email.mime.text import MIMEText
from typing import Protocol

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailSender(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...


class ConsoleEmailSender:
    def send(self, to: str, subject: str, body: str) -> None:
        logger.info(f"[EMAIL] To: {to} | Subject: {subject} | Body: {body[:200]}...")


class SMTPEmailSender:
    def __init__(self) -> None:
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME
        self.password = settings.SMTP_PASSWORD
        self.from_addr = settings.SMTP_FROM

    def send(self, to: str, subject: str, body: str) -> None:
        msg = MIMEText(body, "plain")
        msg["Subject"] = subject
        msg["From"] = self.from_addr
        msg["To"] = to

        with smtplib.SMTP(self.host, self.port) as server:
            if self.username and self.password:
                server.starttls()
                server.login(self.username, self.password)
            server.send_message(msg)


def get_email_sender() -> EmailSender:
    if settings.SMTP_HOST and settings.ENVIRONMENT != "development":
        return SMTPEmailSender()
    return ConsoleEmailSender()

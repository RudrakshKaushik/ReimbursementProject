import os
import imaplib
import email
from celery import shared_task
from dotenv import load_dotenv
from expenses.services import process_email
import logging
logger = logging.getLogger(__name__)

@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=60, retry_kwargs={'max_retries': 5})
def fetch_emails_task(self):
    load_dotenv()
    logger.info("Fetch emails task started")
    mail = imaplib.IMAP4_SSL(
        os.getenv("IMAP_HOST"),
        int(os.getenv("IMAP_PORT"))
    )
    mail.login(
        os.getenv("IMAP_USER"),
        os.getenv("IMAP_PASSWORD")
    )

    mail.select("inbox")

    status, messages = mail.search(None, "UNSEEN")
    
    logger.info(f"Search status: {status}")
    logger.info(f"Raw messages: {messages}")
    
    for num in messages[0].split():
        status, data = mail.fetch(num, "(RFC822)")

        msg = email.message_from_bytes(data[0][1])

        message_id = msg.get("Message-ID")
        subject = msg.get("subject", "")
        sender = email.utils.parseaddr(msg.get("from"))[1]

        body = ""
        attachments = []

        for part in msg.walk():
            if part.get_content_type() == "text/plain" and part.get_content_disposition() is None:
                body = part.get_payload(decode=True).decode(errors="ignore")

            if part.get_content_disposition() == "attachment":
                filename = part.get_filename()
                filedata = part.get_payload(decode=True)
                attachments.append((filename, filedata))


        process_email(message_id, subject, sender, body, attachments)

        # mark as read
        mail.store(num, '+FLAGS', '\\Seen')

    mail.logout()
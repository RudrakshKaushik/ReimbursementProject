import os
import django
import imaplib
import email
from dotenv import load_dotenv

load_dotenv()

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from expenses.services import process_email

mail = imaplib.IMAP4_SSL(os.getenv("IMAP_HOST"), int(os.getenv("IMAP_PORT")))
mail.login(os.getenv("IMAP_USER"), os.getenv("IMAP_PASSWORD"))

mail.select("inbox")

status, messages = mail.search(None, "UNSEEN")

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
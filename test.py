import os
import imaplib
from dotenv import load_dotenv

# load .env
load_dotenv()

host = os.getenv("IMAP_HOST")
port = int(os.getenv("IMAP_PORT"))
user = os.getenv("IMAP_USER")
password = os.getenv("IMAP_PASSWORD")

print("Host:", host)
print("User:", user)

mail = imaplib.IMAP4_SSL(host, port)
mail.login(user, password)

print("✅ Email Connected Successfully")
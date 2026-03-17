from datetime import date
from django.utils import timezone
from django.core.files.base import ContentFile
from .models import EmailMessage, Attachment, Employee, ExpenseRecord
import requests


def process_email(message_id, subject, sender_email, body, attachments, raw_payload=None):
    """
    Process incoming email and create expense record if employee exists
    """

    # 1️⃣ Avoid duplicate email processing
    if EmailMessage.objects.filter(message_id=message_id).exists():
        return {"status": "duplicate_email"}

    # 2️⃣ Save email message
    email_message = EmailMessage.objects.create(
        message_id=message_id,
        from_email=sender_email,
        subject=subject,
        body=body,
        received_at=timezone.now(),
        raw_payload=raw_payload,
    )

    # 3️⃣ Save attachments
    for filename, filedata in attachments:

        file = ContentFile(filedata, name=filename)

        Attachment.objects.create(
            email=email_message,
            file=file,
            file_data=filedata,
            filename=filename,
            content_type="application/octet-stream",
            size=len(filedata),
        )

    # 4️⃣ Check if employee exists
    employee = Employee.objects.filter(email=sender_email, is_active=True).first()

    if not employee:
        return {"status": "employee_not_found"}

    # 5️⃣ Link email to employee
    email_message.employee = employee
    email_message.save()

    # 6️⃣ Determine expense month
    today = date.today()
    month_date = today.replace(day=1)

    # 7️⃣ Get or create expense record
    expense_record, created = ExpenseRecord.objects.get_or_create(
        employee=employee,
        month=month_date,
        defaults={
            "status": ExpenseRecord.STATUS_DRAFT,
            "current_approver": employee.manager,
        },
    )

    # 8️⃣ Link email to expense record
    email_message.expense_record = expense_record
    email_message.save()

    # 9️⃣ Trigger Gemini API
    try:
        attachment_ids = list(
            Attachment.objects.filter(email=email_message).values_list("id", flat=True)
        )

        requests.post(
            "http://127.0.0.1:8000/api/gemini/",
            json={
                "expense_record_id": expense_record.id,
                "attachment_ids": attachment_ids
            },
            timeout=10
        )

    except Exception as e:
        print("Gemini API trigger failed:", e)

    # 🔟 Final response
    return {
        "status": "expense_record_created" if created else "expense_record_updated",
        "expense_record_id": expense_record.id,
    }
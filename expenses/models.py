from django.conf import settings
from django.db import models


class Employee(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="employee_profile",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    manager = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reports",
    )
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.name


class ExpenseRecord(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_PENDING, "Pending Approval"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="expense_records")
    month = models.DateField(help_text="Any date within the month this record represents")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    current_approver = models.ForeignKey(
        Employee,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="records_to_approve",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-month", "-created_at"]
        unique_together = ("employee", "month")

    def __str__(self) -> str:
        return f"{self.employee} - {self.month:%Y-%m}"


class EmailMessage(models.Model):
    message_id = models.CharField(max_length=255, unique=True)
    from_email = models.EmailField()
    subject = models.CharField(max_length=500, blank=True)
    body = models.TextField(blank=True)
    received_at = models.DateTimeField()
    raw_payload = models.JSONField(blank=True, null=True)
    employee = models.ForeignKey(
        Employee,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="emails",
    )
    expense_record = models.ForeignKey(
        ExpenseRecord,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="emails",
    )

    def __str__(self) -> str:
        return self.subject or self.message_id


class Attachment(models.Model):
    email = models.ForeignKey(EmailMessage, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to="attachments/")
    filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100, blank=True)
    size = models.PositiveIntegerField(default=0)

    file_data = models.BinaryField(null=True, blank=True)  # NEW binary field

    expense_record = models.ForeignKey(
        ExpenseRecord,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="attachments",
    )

    def __str__(self) -> str:
        return self.filename


class ExpenseLineItem(models.Model):
    expense_record = models.ForeignKey(
        ExpenseRecord,
        on_delete=models.CASCADE,
        related_name="line_items",
    )
    description = models.CharField(max_length=500)
    date = models.DateField()
    category = models.CharField(max_length=100, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    vendor = models.CharField(max_length=255, blank=True)
    attachment = models.ForeignKey(
        Attachment,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="line_items",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.date} - {self.description} ({self.amount})"


class ApprovalRule(models.Model):
    name = models.CharField(max_length=255)
    min_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    max_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    approver = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="approval_rules",
    )
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.name
    

from django.db import models
from django.contrib.auth.models import User

class Approval(models.Model):

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

    expense_record = models.ForeignKey(
        ExpenseRecord,
        on_delete=models.CASCADE,
        related_name="approvals"
    )

    approver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="approvals_to_review"
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="PENDING"
    )

    comments = models.TextField(blank=True, null=True)

    approved_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.expense_record.id} - {self.approver.username} - {self.status}"    


from django.contrib import admin

from .models import (
    ApprovalRule,
    Attachment,
    EmailMessage,
    Employee,
    ExpenseLineItem,
    ExpenseRecord,
    Approval
)


# ----------------------------
# Approval
# ----------------------------
admin.site.register(Approval)


# ----------------------------
# Employee
# ----------------------------
@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "manager", "is_active")
    search_fields = ("name", "email")


# ----------------------------
# Expense Record
# ----------------------------
@admin.register(ExpenseRecord)
class ExpenseRecordAdmin(admin.ModelAdmin):
    list_display = ("employee", "month", "status", "total_amount", "current_approver")
    list_filter = ("status", "month")


# ----------------------------
# Expense Line Item (UPDATED)
# ----------------------------
@admin.register(ExpenseLineItem)
class ExpenseLineItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "expense_record",
        "date",
        "description",
        "amount",
        "category",
        "vendor",
        "is_approved",   # 👈 ADDED
    )
    list_filter = (
        "category",
        "date",
        "is_approved",   # 👈 ADDED FILTER
    )
    search_fields = ("description", "vendor")

    # Optional: show field in edit form
    fields = (
        "expense_record",
        "date",
        "description",
        "amount",
        "category",
        "vendor",
        "is_approved",   # 👈 ADDED
        "attachment",
    )


# ----------------------------
# Email Message
# ----------------------------
@admin.register(EmailMessage)
class EmailMessageAdmin(admin.ModelAdmin):
    list_display = ("subject", "from_email", "received_at", "employee", "expense_record")
    search_fields = ("subject", "from_email")


# ----------------------------
# Attachment
# ----------------------------
@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ("filename", "email", "expense_record", "size", "content_type")


# ----------------------------
# Approval Rule
# ----------------------------
@admin.register(ApprovalRule)
class ApprovalRuleAdmin(admin.ModelAdmin):
    list_display = ("name", "min_amount", "max_amount", "approver", "is_active")
    list_filter = ("is_active",)
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

admin.site.register(Approval)
@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "manager", "is_active")
    search_fields = ("name", "email")


@admin.register(ExpenseRecord)
class ExpenseRecordAdmin(admin.ModelAdmin):
    list_display = ("employee", "month", "status", "total_amount", "current_approver")
    list_filter = ("status", "month")


@admin.register(ExpenseLineItem)
class ExpenseLineItemAdmin(admin.ModelAdmin):
    list_display = ("expense_record", "date", "description", "amount", "category", "vendor")
    list_filter = ("category", "date")


@admin.register(EmailMessage)
class EmailMessageAdmin(admin.ModelAdmin):
    list_display = ("subject", "from_email", "received_at", "employee", "expense_record")
    search_fields = ("subject", "from_email")


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ("filename", "email", "expense_record", "size", "content_type")


@admin.register(ApprovalRule)
class ApprovalRuleAdmin(admin.ModelAdmin):
    list_display = ("name", "min_amount", "max_amount", "approver", "is_active")
    list_filter = ("is_active",)


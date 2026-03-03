from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    ApprovalRule,
    Attachment,
    EmailMessage,
    Employee,
    ExpenseLineItem,
    ExpenseRecord,
)


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]


class EmployeeSerializer(serializers.ModelSerializer):
    manager = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = Employee
        fields = ["id", "name", "email", "manager", "is_active"]


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ["id", "filename", "content_type", "size", "file"]
        read_only_fields = ["id", "size"]


class ExpenseLineItemSerializer(serializers.ModelSerializer):
    attachment = AttachmentSerializer(read_only=True)

    class Meta:
        model = ExpenseLineItem
        fields = [
            "id",
            "description",
            "date",
            "category",
            "amount",
            "vendor",
            "attachment",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ExpenseRecordSerializer(serializers.ModelSerializer):
    employee = EmployeeSerializer(read_only=True)
    employee_id = serializers.PrimaryKeyRelatedField(
        source="employee", queryset=Employee.objects.all(), write_only=True
    )
    line_items = ExpenseLineItemSerializer(many=True, read_only=True)

    class Meta:
        model = ExpenseRecord
        fields = [
            "id",
            "employee",
            "employee_id",
            "month",
            "status",
            "total_amount",
            "current_approver",
            "created_at",
            "updated_at",
            "line_items",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ApprovalRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalRule
        fields = ["id", "name", "min_amount", "max_amount", "approver", "is_active"]


class EmailMessageSerializer(serializers.ModelSerializer):
    attachments = AttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = EmailMessage
        fields = [
            "id",
            "message_id",
            "from_email",
            "subject",
            "body",
            "received_at",
            "employee",
            "expense_record",
            "attachments",
        ]
        read_only_fields = ["id"]


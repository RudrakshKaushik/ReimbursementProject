from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    ApprovalRule,
    EmailMessage,
    Employee,
    ExpenseLineItem,
    ExpenseRecord,
)
from .serializers import (
    ApprovalRuleSerializer,
    EmailMessageSerializer,
    EmployeeSerializer,
    ExpenseLineItemSerializer,
    ExpenseRecordSerializer,
)


class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return bool(request.user and request.user.is_staff)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsStaffOrReadOnly]


class ExpenseRecordViewSet(viewsets.ModelViewSet):
    queryset = ExpenseRecord.objects.select_related("employee").all()
    serializer_class = ExpenseRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        employee_id = self.request.query_params.get("employee")
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        return qs

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        record = self.get_object()
        if not request.user.is_staff:
            return Response(
                {"detail": "Only managers can approve expenses."},
                status=status.HTTP_403_FORBIDDEN,
            )

        record.status = ExpenseRecord.STATUS_APPROVED
        record.current_approver = None
        record.save(update_fields=["status", "current_approver", "updated_at"])
        serializer = self.get_serializer(record)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="ensure-current-month")
    def ensure_current_month(self, request):
        now = timezone.now().date()
        created = 0
        for employee in Employee.objects.filter(is_active=True):
            obj, was_created = ExpenseRecord.objects.get_or_create(
                employee=employee,
                month=now.replace(day=1),
                defaults={"status": ExpenseRecord.STATUS_DRAFT},
            )
            if was_created:
                created += 1
        return Response({"created": created})


class ExpenseLineItemViewSet(viewsets.ModelViewSet):
    queryset = ExpenseLineItem.objects.select_related("expense_record").all()
    serializer_class = ExpenseLineItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        record_id = self.request.query_params.get("expense_record")
        if record_id:
            qs = qs.filter(expense_record_id=record_id)
        return qs


class ApprovalRuleViewSet(viewsets.ModelViewSet):
    queryset = ApprovalRule.objects.all()
    serializer_class = ApprovalRuleSerializer
    permission_classes = [IsStaffOrReadOnly]


class EmailMessageViewSet(viewsets.ModelViewSet):
    queryset = EmailMessage.objects.all()
    serializer_class = EmailMessageSerializer
    permission_classes = [permissions.IsAuthenticated]


from django.utils import timezone
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view
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

# -------------------------
# Custom Permission
# -------------------------
class IsStaffOrReadOnly(permissions.BasePermission):
    """
    Allow read-only access to any authenticated user.
    Write access only to staff users.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return bool(request.user and request.user.is_staff)


# -------------------------
# LOGIN API
# -------------------------
@api_view(["POST"])
def login_api(request):
    """
    Login API: Accepts email and password, returns user info if valid.
    """
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {"success": False, "message": "Email and password required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user_obj = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"success": False, "message": "User not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    user = authenticate(username=user_obj.username, password=password)

    if user is not None:
        employee = getattr(user, "employee_profile", None)
        return Response(
            {
                "success": True,
                "message": "Login successful",
                "user_id": user.id,
                "email": user.email,
                "employee_id": employee.id if employee else None,
            }
        )

    return Response(
        {"success": False, "message": "Invalid credentials"},
        status=status.HTTP_401_UNAUTHORIZED,
    )


# -------------------------
# EMPLOYEE API
# -------------------------
class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Employees
    """
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsStaffOrReadOnly]


# -------------------------
# EXPENSE RECORD API
# -------------------------
class ExpenseRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Expense Records
    """
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
        """
        Create draft expense records for all active employees for the current month
        """
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


# -------------------------
# EXPENSE LINE ITEM API
# -------------------------
class ExpenseLineItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Expense Line Items
    """
    queryset = ExpenseLineItem.objects.select_related("expense_record").all()
    serializer_class = ExpenseLineItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        record_id = self.request.query_params.get("expense_record")
        if record_id:
            qs = qs.filter(expense_record_id=record_id)
        return qs


# -------------------------
# APPROVAL RULE API
# -------------------------
class ApprovalRuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Approval Rules
    """
    queryset = ApprovalRule.objects.all()
    serializer_class = ApprovalRuleSerializer
    permission_classes = [IsStaffOrReadOnly]


# -------------------------
# EMAIL MESSAGE API
# -------------------------
class EmailMessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Emails
    """
    queryset = EmailMessage.objects.all()
    serializer_class = EmailMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        employee_id = self.request.query_params.get("employee")
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        return qs
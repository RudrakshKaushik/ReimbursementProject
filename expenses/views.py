from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import authenticate

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


# -----------------------------
# Custom Permission
# -----------------------------
class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return bool(request.user and request.user.is_staff)


# -----------------------------
# ViewSets for CRUD
# -----------------------------
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
        return Response(self.get_serializer(record).data)

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


# -----------------------------
# Login API
# -----------------------------
@api_view(["POST"])
def login_api(request):
    """
    Login API accepts email and password,
    verifies against Django auth system,
    returns success/fail and redirect URL.
    """
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {"success": False, "message": "Email and password required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Authenticate via Django user
    user = authenticate(username=email, password=password)

    if user is not None:
        return Response({
            "success": True,
            "message": "Login successful",
            "user_id": user.id,
            "redirect_url": "/dashboard"  # Frontend can use this
        }, status=status.HTTP_200_OK)

    return Response(
        {"success": False, "message": "Invalid email or password"},
        status=status.HTTP_401_UNAUTHORIZED,
    )


# -----------------------------
# Dashboard API
# -----------------------------
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def dashboard_api(request):
    """
    Dashboard API for logged-in user.
    Returns:
    - Employee info
    - Expenses belonging to that employee
    - Expense list (line items) for those expenses
    """

    user = request.user

    try:
        # Get employee using logged-in user's email
        employee = Employee.objects.get(email=user.email)
    except Employee.DoesNotExist:
        return Response(
            {"success": False, "message": "Employee not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # All expenses of this employee
    expenses = ExpenseRecord.objects.filter(employee=employee).order_by("-month")

    # Expense line items for those expenses
    expense_list = ExpenseLineItem.objects.filter(
        expense_record__employee=employee
    )

    return Response({
        "success": True,
        "employee": EmployeeSerializer(employee).data,
        "expenses": ExpenseRecordSerializer(expenses, many=True).data,
        "expense_list": ExpenseLineItemSerializer(expense_list, many=True).data,
        "sections": [
            "Approval Rules",
            "Attachments",
            "Email messages",
            "Employees",
            "Expense line items",
            "Expense records"
        ]
    })
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def dashboard_employee(request):
    """
    Returns all active employees for dashboard
    """

    employees = Employee.objects.filter(is_active=True)

    return Response({
        "success": True,
        "total_employees": employees.count(),
        "employees": EmployeeSerializer(employees, many=True).data
    })
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def dashboard_expenses(request):
    """
    Returns expense records for the logged-in employee
    """

    user = request.user

    try:
        employee = Employee.objects.get(email=user.email)
    except Employee.DoesNotExist:
        return Response(
            {"success": False, "message": "Employee not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Query expense records for this employee
    expenses = ExpenseRecord.objects.filter(employee__email=user.email)

    return Response({
        "success": True,
        "employee_email": user.email,
        "total_expenses": expenses.count(),
        "expenses": ExpenseRecordSerializer(expenses, many=True).data
    })
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def dashboard_expense_list(request):
    """
    Returns expense line items for the logged-in employee
    """

    user = request.user

    try:
        employee = Employee.objects.get(email=user.email)
    except Employee.DoesNotExist:
        return Response(
            {"success": False, "message": "Employee not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Query expense line items belonging to this employee
    expense_list = ExpenseLineItem.objects.filter(
        expense_record__employee__email=user.email
    )

    return Response({
        "success": True,
        "employee_email": user.email,
        "total_items": expense_list.count(),
        "expense_list": ExpenseLineItemSerializer(expense_list, many=True).data
    })

from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.contrib.auth import login

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
        login(request, user)
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
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json


import base64
import json
import requests

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Attachment, ExpenseRecord, ExpenseLineItem


import base64
import json
import requests

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Attachment, ExpenseRecord, ExpenseLineItem



import json
import base64
import requests

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def gemini_api(request):

    try:
        data = request.data

        expense_record_id = data.get("expense_record_id")
        attachment_id = data.get("attachment_id")

        if not expense_record_id or not attachment_id:
            return Response(
                {"error": "Missing required fields"},
                status=status.HTTP_400_BAD_REQUEST
            )

        expense_record = ExpenseRecord.objects.get(id=expense_record_id)
        attachment = Attachment.objects.get(id=attachment_id)

        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent"

        prompt = """
The uploaded image may contain multiple receipts. Some receipts may be duplicate copies of the SAME transaction.

Your goal is to count UNIQUE bills only.

Rules:

1. Carefully analyze the entire image.
2. Identify each receipt separately.
3. Two receipts represent the SAME bill if they share most of these fields:
- Merchant name
- Date and/or time
- Total amount
- Card digits (if visible)
- Order items or subtotal

4. If two receipts represent the same transaction, count them as ONE bill.
5. If receipts have different merchants, dates, or totals, count them as different bills.
6. Ignore partial or cut-off receipts unless they clearly represent a different transaction.

Return ONLY valid JSON.

{
"count": null
}
"""

        # convert binary → base64
        base64_data = base64.b64encode(attachment.file_data).decode("utf-8")
        base64_data = base64_data.replace("\n", "").replace("\r", "")

        mime_type = attachment.file_type or "image/jpeg"

        request_body = {
            "contents": [
                {
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": base64_data
                            }
                        },
                        {
                            "text": prompt
                        }
                    ]
                }
            ]
        }

        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": ""
        }

        response = requests.post(
            url,
            headers=headers,
            data=json.dumps(request_body)
        )

        response_json = response.json()

        try:
            gemini_text = response_json["candidates"][0]["content"]["parts"][0]["text"]
            parsed_data = json.loads(gemini_text)
            bill_count = parsed_data.get("count", 0)

        except Exception as e:
            return Response({
                "error": "Failed to parse Gemini response",
                "details": str(e),
                "raw_response": response_json
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Create Expense Line Items
        created_items = []

        for i in range(bill_count):
            line_item = ExpenseLineItem.objects.create(
                expense_record=expense_record,
                attachment=attachment,
                bill_number=i + 1
            )
            created_items.append(line_item.id)

        return Response({
            "unique_bill_count": bill_count,
            "line_items_created": created_items
        }, status=status.HTTP_200_OK)

    except ExpenseRecord.DoesNotExist:
        return Response({"error": "ExpenseRecord not found"}, status=status.HTTP_404_NOT_FOUND)

    except Attachment.DoesNotExist:
        return Response({"error": "Attachment not found"}, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response({
            "error": "Something went wrong",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def approval_api(request):

    expense_record_id = request.data.get("expense_record_id")

    if not expense_record_id:
        return Response(
            {"error": "expense_record_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        expense_record = ExpenseRecord.objects.get(id=expense_record_id)

        # Get all line items
        line_items = ExpenseLineItem.objects.filter(
            expense_record=expense_record
        )

        if not line_items.exists():
            return Response(
                {"error": "No line items found"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get policy (simple version: first policy)
        policy = Policy.objects.first()

        if not policy:
            return Response(
                {"error": "Policy not configured"},
                status=status.HTTP_400_BAD_REQUEST
            )

        violations = []
        total_amount = 0

        # 🔍 Validate each line item
        for item in line_items:
            total_amount += item.amount

            if item.amount > policy.max_amount:
                violations.append({
                    "line_item_id": item.id,
                    "amount": float(item.amount),
                    "reason": "Exceeds max allowed per item"
                })

        # 🔍 Decide status
        if violations:
            approval_status = "REJECTED"
        else:
            approval_status = "APPROVED"

        # Update or create approval record
        approval, created = Approval.objects.get_or_create(
            expense_record=expense_record,
            approver=request.user
        )

        approval.status = approval_status
        approval.comments = "Auto-evaluated by policy engine"
        approval.save()

        return Response({
            "expense_record_id": expense_record.id,
            "status": approval_status,
            "total_amount": float(total_amount),
            "violations": violations
        }, status=status.HTTP_200_OK)

    except ExpenseRecord.DoesNotExist:
        return Response(
            {"error": "ExpenseRecord not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    except Exception as e:
        return Response(
            {
                "error": "Something went wrong",
                "details": str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )    
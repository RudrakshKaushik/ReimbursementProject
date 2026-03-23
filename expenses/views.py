from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from rest_framework.permissions import AllowAny
import base64
from rest_framework.authtoken.models import Token

import requests


from .models import Attachment, ExpenseRecord, ExpenseLineItem, Approval



from datetime import datetime, date
from decimal import Decimal

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
        print(f"Approving record {pk} for user {request.user} (is_staff: {request.user.is_staff})")
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
@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
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
    # Try to find a user with this email first since standard authenticate()
    # matches username field but we have email from frontend.
    try:
        user_with_email = User.objects.get(email=email)
        username = user_with_email.username
    except User.DoesNotExist:
        # If not found, fall back to whatever was provided as username
        username = email

    user = authenticate(username=username, password=password)

    if user is None:
        return Response({"error": "Invalid credentials"}, status=400)
    
    token, _ = Token.objects.get_or_create(user=user)

    django_login(request, user)
    
    return Response({
        "token": token.key,
        "user_id": user.id,
        "username": user.username,
        "success": True,
        "message": "Login successful",
        "redirect_url": "/dashboard"
    }, status=status.HTTP_200_OK)

   


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

@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def gemini_api(request):
    try:
        data = request.data

        expense_record_id = data.get("expense_record_id")
        attachment_ids = data.get("attachment_ids")

        print("🔥 API HIT")

        print("expense_record_id:", expense_record_id)
        print("attachment_ids:", attachment_ids)

        if not expense_record_id or not attachment_ids:
            return Response(
                {"error": "Missing required fields"},
                status=status.HTTP_400_BAD_REQUEST
            )

        expense_record = ExpenseRecord.objects.get(id=expense_record_id)

        created_items = []
        total_bill_count = 0

        for attachment_id in attachment_ids:

            try:
                attachment = Attachment.objects.get(id=attachment_id)
            except Attachment.DoesNotExist:
                continue  # skip invalid attachment

            # 🔥 Convert to base64
            base64_data = base64.b64encode(attachment.file_data).decode("utf-8")
            base64_data = base64_data.replace("\n", "").replace("\r", "")
            PROMPT="""
               You are an expert expense document analyzer.

The uploaded image or document is a bill or receipt. The image can have multiple or duplicate bills so read details carefully. Each belongs to exactly one of these categories:
- Food and Beverages
- Hotel/Accommodation
- Flight Travel
- Office supplies
- Medical expenses
- Training cost
- Petrol/Diesel bill
- Gas fuel
- Parking charges
- Car rental
- Train Travel
- Courier charges
- Relocation expenses
- WFH setup
- Phone and internet bill

If it seems that above categories don't match with the doc, take the category as Miscellaneous.
If it seems that there is no currency in the bill, take it as USD.

Your task:
1. Read the document carefully.
2. Identify:
   - Expense category (type)
   - Total bill amount (amount)
   - Currency in ISO-4217 code
   - Bill Date (only date)
   - Vendor / merchant name and any useful extra info (additional info)

Return ONLY valid JSON.
Return a raw JSON object, not a string.
Do NOT wrap the output in quotes.
Do NOT use markdown or ``` blocks.
Do NOT escape characters.

If a value is NOT found in the bill, return an empty value:
- string → ""
- number → null
- object → {}
- array → []

Do NOT omit any keys.
Do NOT add extra keys.
Do NOT include explanations, markdown, or extra text.

Return JSON strictly in the following structure:
{
  "bills": [
    {
      "type": "",
      "amount": null,
      "currency": "",
      "bill_date": null,
      "additional_info": ""
    }
  ]
}
"""

            request_body = {
                "contents": [
                    {
                        "parts": [
                            {
                                "inline_data": {
                                    "mime_type": "image/jpeg",
                                    "data": base64_data
                                }
                            },
                            {
                                "text": PROMPT
                            }
                        ]
                    }
                ]
            }

            response = requests.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": ""
                },
                data=json.dumps(request_body)
            )

            response_json = response.json()

            try:
                gemini_text = response_json["candidates"][0]["content"]["parts"][0]["text"]
                gemini_text = gemini_text.strip().replace("```json", "").replace("```", "")
                parsed_data = json.loads(gemini_text)

                bills = parsed_data.get("bills", [])
                total_bill_count += len(bills)

            except Exception as e:
                continue  # skip this attachment if parsing fails

            # 🔥 Create line items for each bill
            for bill in bills:

                # date parsing
                bill_date = bill.get("bill_date")
                try:
                    bill_date = datetime.strptime(bill_date, "%Y-%m-%d").date() if bill_date else date.today()
                except:
                    bill_date = date.today()

                # amount parsing
                amount = bill.get("amount")
                try:
                    amount = Decimal(str(amount)) if amount else Decimal("0.00")
                except:
                    amount = Decimal("0.00")

                line_item = ExpenseLineItem.objects.create(
                    expense_record=expense_record,
                    attachment=attachment,
                    description=bill.get("additional_info", "")[:500],
                    date=bill_date,
                    category=bill.get("type", ""),
                    amount=amount,
                    vendor=bill.get("additional_info", "")[:255]
                )

                created_items.append(line_item.id)

        return Response({
            "total_bill_count": total_bill_count,
            "line_items_created": created_items
        }, status=status.HTTP_200_OK)

    except ExpenseRecord.DoesNotExist:
        return Response({"error": "ExpenseRecord not found"}, status=404)

    except Exception as e:
        return Response({
            "error": "Something went wrong",
            "details": str(e)
        }, status=500)
    
    

@api_view(["POST"])
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

        line_items = ExpenseLineItem.objects.filter(
            expense_record=expense_record
        )

        if not line_items.exists():
            return Response(
                {"error": "No line items found"},
                status=status.HTTP_400_BAD_REQUEST
            )

        violations = []
        total_amount = Decimal("0.00")
        approvers_set = set()

        # 🔹 3 month rule
        three_months_ago = timezone.now().date() - timedelta(days=90)

        # 🔹 Load rules
        rules = ApprovalRule.objects.filter(is_active=True)

        for item in line_items:
            total_amount += item.amount

            # 🔥 Normalize category
            item_category = (item.category or "").strip().lower()

            # 🔥 Match rule by category
            matched_rule = rules.filter(
                name__iexact=item_category
            ).first()

            # ❌ No matching rule
            if not matched_rule:
                violations.append({
                    "line_item_id": item.id,
                    "amount": float(item.amount),
                    "reason": "No matching approval rule"
                })
                continue

            # ✅ Add approver from rule
            approvers_set.add(matched_rule.approver)

            # 1️⃣ Date check
            if item.date and item.date < three_months_ago:
                violations.append({
                    "line_item_id": item.id,
                    "amount": float(item.amount),
                    "reason": "Bill older than 3 months"
                })

            # 2️⃣ Amount check
            if item.amount > matched_rule.max_amount:
                violations.append({
                    "line_item_id": item.id,
                    "amount": float(item.amount),
                    "reason": f"Amount exceeds max limit ({matched_rule.max_amount})"
                })

            # (Optional) Min check
           

        # 🔹 Final decision
        approval_status = "ADMIN PENDING" if violations else "APPROVED"

        # 🔥 Create Approval for EACH approver
        created_approvals = []

        for approver in approvers_set:
            approval, created = Approval.objects.get_or_create(
                expense_record=expense_record,
                approver=approver
            )

            approval.status = approval_status
            approval.comments = "Auto-evaluated by system"
            approval.approved_at = timezone.now()
            approval.save()

            created_approvals.append(approval.id)

        # 🔹 Update ExpenseRecord
        if approval_status == "APPROVED":
            expense_record.status = ExpenseRecord.STATUS_APPROVED
        else:
            expense_record.status = ExpenseRecord.STATUS_PENDING

        expense_record.total_amount = total_amount
        expense_record.save()

        return Response({
            "expense_record_id": expense_record.id,
            "status": approval_status,
            "total_amount": float(total_amount),
            "violations": violations,
            "approvals_created": created_approvals
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
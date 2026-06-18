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
import os
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
from .tasks import fetch_emails_task


def _fetch_emails_if_enabled():
    if os.getenv("FETCH_EMAILS_ENABLED", "true").lower() != "true":
        return {"status": "skipped"}
    try:
        return fetch_emails_task.apply().get()
    except Exception as exc:
        return {"status": "failed", "error": str(exc)}


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

    try:
        user_with_email = User.objects.get(email=email)
        username = user_with_email.username
    except User.DoesNotExist:
        username = email

    user = authenticate(username=username, password=password)

    if user is None:
        return Response({"error": "Invalid credentials"}, status=400)

    # 🔥 Role logic
    role = "admin" if user.is_superuser else "user"

    token, _ = Token.objects.get_or_create(user=user)
    django_login(request, user)

    email_fetch = _fetch_emails_if_enabled()

    return Response({
        "token": token.key,
        "user_id": user.id,
        "username": user.username,
        "role": role,  # ✅ added role here
        "success": True,
        "message": "Login successful",
        "redirect_url": "/dashboard",
        "email_fetch": email_fetch,
    }, status=status.HTTP_200_OK)
   


# -----------------------------
# Dashboard API
# -----------------------------
@api_view(["GET"])
@permission_classes([AllowAny])
def dashboard_api(request):
    """
    Dashboard API for logged-in user.
    Returns:
    - Employee info
    - Expenses belonging to that employee
    - Expense list (line items) for those expenses
    """

    user = request.user

    email_fetch = _fetch_emails_if_enabled()

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
        "email_fetch": email_fetch,
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
    with approval flag
    """

    user = request.user

    try:
        employee = Employee.objects.get(email=user.email)
    except Employee.DoesNotExist:
        return Response(
            {"success": False, "message": "Employee not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    expense_list = ExpenseLineItem.objects.select_related(
        "expense_record"
    ).filter(
        expense_record__employee__email=user.email
    )

    data = []

    for item in expense_list:
        data.append({
            "id": item.id,
            "description": item.description,
            "amount": float(item.amount),
            "category": item.category,
            "date": item.date,
            "vendor": item.vendor,
            "violation_reason": item.violation_reason,
            "is_approved": item.is_approved,

            # ✅ NEW FIELD
            "approval_status": item.expense_record.status
        })

    return Response({
        "success": True,
        "employee_email": user.email,
        "total_items": len(data),
        "expense_list": data
    })

import base64
import json
import requests
import os

from datetime import datetime, date
from decimal import Decimal

from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from dotenv import load_dotenv
load_dotenv()

from .models import ExpenseRecord, Attachment, ExpenseLineItem


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def gemini_api(request):
    try:
        import os
        import re
        import base64
        import json
        import requests
        from decimal import Decimal
        from datetime import datetime, date

        data = request.data

        expense_record_id = data.get("expense_record_id")
        attachment_ids = data.get("attachment_ids")

        print("🔥 API HIT")
        print("expense_record_id:", expense_record_id)
        print("attachment_ids:", attachment_ids)

        if not expense_record_id or not attachment_ids:
            return Response({"error": "Missing required fields"}, status=400)

        expense_record = ExpenseRecord.objects.get(id=expense_record_id)

        GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

        print("GEMINI_API_KEY exists:", bool(GEMINI_API_KEY))
        print("GEMINI_API_KEY first 10 chars:", GEMINI_API_KEY[:10] if GEMINI_API_KEY else "NOT FOUND")

        if not GEMINI_API_KEY:
            return Response(
                {"error": "GEMINI_API_KEY not found in environment"},
                status=500
            )

        created_items = []
        total_bill_count = 0

        PROMPT = """
You are an expert expense document analyzer.

Return ONLY valid JSON:

{
  "bills": [
    {
      "type": "",
      "amount": null,
      "currency": "",
      "bill_date": null,
      "vendor": "",
      "additional_info": ""
    }
  ]
}

Rules:
- type must be one of: food, hotel, flight_ticket, train_ticket, car_rental, fuel, gas, parking, office_supplies, medical, courier, telecom, training, relocation, wfh, miscellaneous
- amount must be total payable amount only
- bill_date must be YYYY-MM-DD
- vendor must be only merchant/company name, max 1-5 words
- additional_info should contain itemized/important receipt details
"""

        for attachment_id in attachment_ids:
            try:
                attachment = Attachment.objects.get(id=attachment_id)
            except Attachment.DoesNotExist:
                print("❌ Attachment not found:", attachment_id)
                continue

            if not attachment.file_data:
                print("❌ Empty file_data for attachment:", attachment_id)
                continue

            file_name = getattr(attachment, "filename", None) or getattr(attachment, "file_name", None) or "file.jpg"
            ext = file_name.split(".")[-1].lower() if "." in file_name else ""

            mime_map = {
                "pdf": "application/pdf",
                "jpg": "image/jpeg",
                "jpeg": "image/jpeg",
                "png": "image/png",
                "webp": "image/webp",
            }

            mime_type = mime_map.get(ext, "image/jpeg")

            print(f"📄 Processing: {file_name} | MIME: {mime_type}")

            base64_data = base64.b64encode(attachment.file_data).decode("utf-8")

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
                                "text": PROMPT
                            }
                        ]
                    }
                ]
            }

            response = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={GEMINI_API_KEY}",
                headers={"Content-Type": "application/json"},
                json=request_body,
                timeout=60
            )

            response_json = response.json()
            print("📥 Gemini Raw Response:", response_json)

            if "error" in response_json:
                print("❌ Gemini API Error:", response_json["error"].get("message"))
                continue

            try:
                candidates = response_json.get("candidates", [])
                if not candidates:
                    print("❌ No candidates returned")
                    continue

                gemini_text = candidates[0]["content"]["parts"][0].get("text", "")
                print("📝 Gemini Text:", gemini_text)

                match = re.search(r"\{.*\}", gemini_text, re.DOTALL)
                if not match:
                    print("❌ No JSON found in Gemini response")
                    continue

                parsed_data = json.loads(match.group(0))
                bills = parsed_data.get("bills", [])

                print("✅ Bills found:", len(bills))
                total_bill_count += len(bills)

            except Exception as e:
                print("❌ JSON Parse Error:", str(e))
                continue

            for bill in bills:
                try:
                    bill_date = (
                        datetime.strptime(bill.get("bill_date"), "%Y-%m-%d").date()
                        if bill.get("bill_date")
                        else date.today()
                    )
                except Exception:
                    bill_date = date.today()

                try:
                    amount = (
                        Decimal(str(bill.get("amount")))
                        if bill.get("amount") not in [None, ""]
                        else Decimal("0.00")
                    )
                except Exception:
                    amount = Decimal("0.00")

                line_item = ExpenseLineItem.objects.create(
                    expense_record=expense_record,
                    attachment=attachment,
                    description=str(bill.get("additional_info", ""))[:500],
                    date=bill_date,
                    category=str(bill.get("type", "miscellaneous")),
                    amount=amount,
                    vendor=str(bill.get("vendor", ""))[:255],
                )

                created_items.append(line_item.id)
                print("✅ Line item created:", line_item.id)

        return Response({
            "total_bill_count": total_bill_count,
            "line_items_created": created_items
        }, status=200)

    except ExpenseRecord.DoesNotExist:
        return Response({"error": "ExpenseRecord not found"}, status=404)

    except Exception as e:
        print("❌ Main Error:", str(e))
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
        all_violations_summary = set()   # ✅ NEW
        total_amount = Decimal("0.00")
        approvers_set = set()

        # 🔹 3 month rule
        three_months_ago = timezone.now().date() - timedelta(days=90)

        # 🔹 Load rules
        rules = ApprovalRule.objects.filter(is_active=True)

        for item in line_items:
            total_amount += item.amount
            reasons = []

            # 🔥 Normalize category
            item_category = (item.category or "").strip().lower()

            matched_rule = rules.filter(
                name__iexact=item_category
            ).first()

            # ❌ No rule
            if not matched_rule:
                reasons.append("No matching approval rule")
            else:
                approvers_set.add(matched_rule.approver)

                # ✅ Rule 1: Bill older than 3 months
                if item.date and item.date < three_months_ago:
                    reasons.append("Policy Violation: Bill older than 3 months")

                # ✅ Rule 2: Amount exceeds
                if item.amount > matched_rule.max_amount:
                    reasons.append(
                        f"Policy Violation: Amount exceeds limit ({matched_rule.max_amount})"
                    )

            # ✅ Rule 3: Duplicate bill
            duplicate_exists = ExpenseLineItem.objects.filter(
                expense_record__employee=expense_record.employee,
                amount=item.amount,
                date=item.date,
                vendor=item.vendor
            ).exclude(id=item.id).exists()

            if duplicate_exists:
                reasons.append("Policy Violation: Duplicate bill detected")

            # 🔥 SAVE TO DB
            if reasons:
                item.violation_reason = " | ".join(reasons)
                item.is_approved = False

                # ✅ ADD TO RECEIPT SUMMARY
                for r in reasons:
                    all_violations_summary.add(r)

            else:
                item.violation_reason = None
                item.is_approved = True

            item.save(update_fields=["violation_reason", "is_approved"])

            # 🔹 Collect for response
            if reasons:
                violations.append({
                    "line_item_id": item.id,
                    "amount": float(item.amount),
                    "reason": item.violation_reason
                })

        # 🔥 FINAL DECISION
        if violations:
            approval_status = "ADMIN PENDING"
            final_message = "Sent to manager for approval"

            expense_record.status = ExpenseRecord.STATUS_PENDING
            expense_record.current_approver = expense_record.employee.manager
        else:
            approval_status = "APPROVED"
            final_message = "Approved by system"

            expense_record.status = ExpenseRecord.STATUS_APPROVED
            expense_record.current_approver = None

        # 🔥 Create approvals
        created_approvals = []

        for approver in approvers_set:
            approval, created = Approval.objects.get_or_create(
                expense_record=expense_record,
                approver=approver
            )

            approval.status = approval_status
            approval.comments = final_message
            approval.approved_at = timezone.now()
            approval.save()

            created_approvals.append(approval.id)

        # 🔹 Save record
        expense_record.total_amount = total_amount
        expense_record.save()

        return Response({
            "expense_record_id": expense_record.id,
            "status": approval_status,
            "message": final_message,
            "total_amount": float(total_amount),

            "violations": violations,

            # ✅ NEW: ALL violations in receipt
            "all_violations_in_receipt": list(all_violations_summary),

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
    
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def my_approvals_api(request):
    """
    Returns approvals where approver = logged-in employee
    """

    try:
        employee = Employee.objects.get(email=request.user.email)
    except Employee.DoesNotExist:
        return Response(
            {"error": "Employee not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # 🔥 MAIN FILTER
    approvals = Approval.objects.select_related(
        "expense_record", "expense_record__employee"
    ).filter(approver=employee).order_by("-id")

    data = []

    for approval in approvals:
        data.append({
            "approval_id": approval.id,
            "expense_record_id": approval.expense_record.id,
            "employee_name": approval.expense_record.employee.name,
            "status": approval.status,
            "comments": approval.comments,
            "approved_at": approval.approved_at,
        })

    return Response({
        "success": True,
        "total_approvals": approvals.count(),
        "approvals": data
    }, status=status.HTTP_200_OK)

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def approval_rules_api(request):
    """
    Fetch all approval rules from DB (created via admin)
    """

    rules = ApprovalRule.objects.all()   # 👈 gets everything from admin table

    return Response({
        "success": True,
        "total_rules": rules.count(),
        "rules": ApprovalRuleSerializer(rules, many=True).data
    }, status=status.HTTP_200_OK)

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def all_approvals_api(request):
    """
    Returns all approvals in the system (admin only)
    """

    # 🔒 Restrict to admin/staff
    if not request.user.is_staff:
        return Response(
            {"error": "Only admin can view all approvals"},
            status=status.HTTP_403_FORBIDDEN
        )

    approvals = Approval.objects.select_related(
        "expense_record", "approver", "expense_record__employee"
    ).all().order_by("-id")

    data = []

    for approval in approvals:
        data.append({
            "approval_id": approval.id,
            "expense_record_id": approval.expense_record.id,

            # ✅ ADD THIS LINE
            "employee_id": approval.expense_record.employee.id,

            "employee_name": approval.expense_record.employee.name,
            "approver_name": approval.approver.name,
            "status": approval.status,
            "comments": approval.comments,
            "approved_at": approval.approved_at,
        })

    return Response({
        "success": True,
        "total_approvals": approvals.count(),
        "approvals": data
    }, status=status.HTTP_200_OK)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

@api_view(["PATCH", "PUT"])
@permission_classes([IsAuthenticated])
def update_expense_line_item(request, pk):
    try:
        # 🔹 Get line item
        line_item = ExpenseLineItem.objects.select_related(
            "expense_record__employee"
        ).get(id=pk)

        # 🔒 Ownership check
        employee = line_item.expense_record.employee

        if employee.email != request.user.email:
            return Response(
                {"error": "You are not allowed to edit this expense"},
                status=status.HTTP_403_FORBIDDEN
            )

        # 🔹 Update
        serializer = ExpenseLineItemSerializer(
            line_item,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save(is_edited=True)  # optional tracking

            return Response({
                "message": "Line item updated successfully",
                "data": serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except ExpenseLineItem.DoesNotExist:
        return Response(
            {"error": "Line item not found"},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def expense_line_items_by_record(request, expense_record_id):
    try:
        # Validate expense record exists
        expense_record = ExpenseRecord.objects.get(id=expense_record_id)

        # Fetch all line items
        line_items = ExpenseLineItem.objects.filter(
            expense_record=expense_record
        ).select_related("expense_record")

        data = []

        for item in line_items:
            data.append({
                "id": item.id,
                "description": item.description,
                "amount": float(item.amount),
                "category": item.category,
                "date": item.date,
                "vendor": item.vendor,
                "violation_reason": item.violation_reason,
                "approval_status": item.expense_record.status,
                "is_approved": item.is_approved,
                "attachment_id": item.attachment.id if item.attachment else None
            })

        return Response({
            "success": True,
            "expense_record_id": expense_record.id,
            "employee_name": expense_record.employee.name,
            "month": expense_record.month,
            "total_items": len(data),
            "line_items": data
        })

    except ExpenseRecord.DoesNotExist:
        return Response(
            {"error": "Expense record not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    except Exception as e:
        return Response(
            {"error": "Something went wrong", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
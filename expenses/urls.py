from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ApprovalRuleViewSet,
    EmailMessageViewSet,
    EmployeeViewSet,
    ExpenseLineItemViewSet,
    ExpenseRecordViewSet,
    login_api,
    dashboard_api,
    dashboard_employee,
    dashboard_expenses,
    gemini_api,
    dashboard_expense_list,                # now exists in views.py
)

# Create a router and register all viewsets
router = DefaultRouter()
router.register(r"employees", EmployeeViewSet, basename="employee")
router.register(r"expense-records", ExpenseRecordViewSet, basename="expense-record")
router.register(r"line-items", ExpenseLineItemViewSet, basename="line-item")
router.register(r"approval-rules", ApprovalRuleViewSet, basename="approval-rule")
router.register(r"emails", EmailMessageViewSet, basename="email")

# Define URL patterns
urlpatterns = [
    path("login/", login_api, name="login_api"),  # login API endpoint
    path("dashboard/", dashboard_api, name="dashboard_api"),
    path("dashboard/employee/", dashboard_employee, name="dashboard_employee"),
    path("dashboard/expenses/", dashboard_expenses, name="dashboard_expenses"),
    path("dashboard/expenselist/", dashboard_expense_list, name="dashboard_expense_list"),
    path("gemini/", gemini_api, name="gemini_api"),
    path("", include(router.urls)),               # all other viewsets
]
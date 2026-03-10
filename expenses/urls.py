from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ApprovalRuleViewSet,
    EmailMessageViewSet,
    EmployeeViewSet,
    ExpenseLineItemViewSet,
    ExpenseRecordViewSet,
    login_api,  # make sure login_api exists in views.py
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
    path("login/", login_api, name="login_api"),  # login API
    path("", include(router.urls)),               # all viewset APIs
]
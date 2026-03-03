from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ApprovalRuleViewSet,
    EmailMessageViewSet,
    EmployeeViewSet,
    ExpenseLineItemViewSet,
    ExpenseRecordViewSet,
)

router = DefaultRouter()
router.register(r"employees", EmployeeViewSet, basename="employee")
router.register(r"expense-records", ExpenseRecordViewSet, basename="expense-record")
router.register(r"line-items", ExpenseLineItemViewSet, basename="line-item")
router.register(r"approval-rules", ApprovalRuleViewSet, basename="approval-rule")
router.register(r"emails", EmailMessageViewSet, basename="email")

urlpatterns = [
    path("", include(router.urls)),
]


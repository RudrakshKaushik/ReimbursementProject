from django.contrib import admin
from django.urls import include, path
from expenses import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("expenses.urls")),
#   path('login/', views.login_view, name='login'),
]


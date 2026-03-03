# Expense Management Application

Backend: **Django + Django REST Framework**  
Frontend: **React (Vite)**

This is the starting codebase for an expense management system with employees, expense records, line items, email ingestion, and approval flows. More functionality (email parsing, Gemini integration, advanced approval rules) will be added on top of this skeleton.

## Backend (Django)

### Setup

```bash
cd "e:\Bitloom\Expense Application"
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`.

### Apps and models

- `expenses`
  - `Employee`
  - `ExpenseRecord`
  - `ExpenseLineItem`
  - `EmailMessage`
  - `Attachment`
  - `ApprovalRule`

Basic CRUD endpoints are exposed via Django REST Framework viewsets under `/api/`.

## Frontend (React + Vite)

### Setup

```bash
cd "e:\Bitloom\Expense Application\frontend"
npm install
npm run dev
```

The React app will run on `http://localhost:5173` and proxy API calls to `http://localhost:8000/api`.

### Current pages

- Expense list page (lists expense records and links to details)
- Expense detail page (shows line items and a simple **Approve** button)

## Next steps

- Wire up real authentication (JWT or session-based).
- Implement email ingestion and Gemini-based line item extraction.
- Implement full approval routing rules and notifications.
- Add filtering, search, and better UX for employees and managers.


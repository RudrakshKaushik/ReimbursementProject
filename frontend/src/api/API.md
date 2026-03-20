# API Documentation

## 1. Login API

### Endpoint

`POST /api/login/`

### Request Body

```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

### Response (Success)

```json
{
  "success": true,
  "message": "Login successful",
  "user_id": 1,
  "redirect_url": "/dashboard"
}
```

### Response (Error)

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```


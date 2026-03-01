import requests

register = requests.post("http://127.0.0.1:8000/auth/user/register", json={
  "first_name": "Test",
  "last_name": "Customer",
  "email": "testcust_login@example.com",
  "phone": "+951234567",
  "password": "test123",
  "user_type": "customer",
})
print("REGISTER", register.status_code, register.text)

login = requests.post("http://127.0.0.1:8000/auth/user/login", json={
  "email": "testcust_login@example.com",
  "password": "test123",
})
print("LOGIN", login.status_code, login.text)

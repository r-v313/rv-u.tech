# RVU Labs / RVU Shop — API Hunting Lab

**Project:** RVU Mentorship Camp · Instructor: Ramez Medhat  
**Website:** https://rv-u.tech/labs/

## This directory

The /labs route on rv-u.tech is the **public training-labs catalog**, hosted on GitHub Pages. GitHub Pages serves static HTML/CSS/JS only and **cannot run Python FastAPI or SQLite**. The vulnerable RVU Shop backend intentionally must **not** be deployed at this public URL.

The full practical project is distributed to students by the instructor as `RVU-Shop-Practical-API-Lab.zip`. This public directory is a setup/reference page, **not the Python source or downloadable archive**.

## Student setup (from the full ZIP provided by the instructor)

1. Extract the ZIP locally.
2. Start Docker Desktop.
3. In the extracted `rvu-shop-lab` folder, run `docker compose up --build`.
4. Open http://localhost:8000 and http://localhost:8000/docs.
5. Use Burp Suite to observe and replay requests; test only your isolated lab instance.

Docker Compose binds the vulnerable backend to `127.0.0.1:8000`. Do not expose it publicly or tunnel it without isolated student instances and a hardened access layer.

## 12 core API operations

```text
POST   /api/v1/auth/login
GET    /api/v1/profile
PATCH  /api/v1/profile
GET    /api/v1/products
GET    /api/v1/products/104
POST   /api/v1/cart/items
GET    /api/v1/cart
POST   /api/v1/cart/apply-coupon
GET    /api/v1/addresses
PUT    /api/v1/addresses/456
POST   /api/v1/checkout
GET    /api/v1/orders/782
```

The instructor-only ANSWER_KEY and secret credentials should not be placed in public GitHub Pages assets.

**Public labs index:** https://rv-u.tech/labs/

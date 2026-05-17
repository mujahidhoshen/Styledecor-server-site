# StyleDecor Server

Secure Express/MongoDB REST API for StyleDecor bookings, role dashboards, decorator assignment, analytics, and Stripe payments.

## Features

- JWT authentication middleware with role guards for user, admin, and decorator APIs.
- Modular routes, controllers, middleware, services, utilities, config, and Mongoose models.
- Request validation with Zod and consistent JSON error responses.
- Ownership protection for user bookings and payment history.
- Admin-only service, booking, decorator, revenue, and analytics endpoints.
- Decorator-only assigned project, schedule, status workflow, earnings, and payment endpoints.
- Stripe PaymentIntent creation and transaction persistence.
- MongoDB indexes for user lookup, service search/filtering, booking dashboards, and payments.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The API runs on `http://localhost:5001` by default.

## Environment Variables

```env
PORT=5001
MONGODB_URI=
JWT_SECRET=
STRIPE_SECRET_KEY=
CLIENT_URL=http://localhost:5173
```

## Main Endpoints

- `POST /jwt`
- `POST /users`, `GET /users/:email`, `PATCH /users/:id/role`
- `GET /services`, `GET /services/:id`, `POST /services`, `PATCH /services/:id`, `DELETE /services/:id`
- `POST /bookings`, `GET /bookings/my-bookings`, `GET /bookings`, `PATCH /bookings/:id`, `DELETE /bookings/:id`
- `PATCH /bookings/:id/status`, `PATCH /bookings/:id/assign-decorator`
- `GET /decorators`, `GET /decorators/top`, `PATCH /decorators/:id/status`, `DELETE /decorators/:id`
- `GET /decorator/assigned-projects`, `GET /decorator/today-schedule`, `PATCH /decorator/projects/:id/status`
- `POST /create-payment-intent`, `POST /payments`, `GET /payments/my-payments`
- `GET /admin/revenue`, `GET /admin/analytics/service-demand`

## Admin Setup

Firebase handles account creation. After creating the first account, manually update that user document in MongoDB:

```js
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

## Deployment

- Set all environment variables in Vercel.
- Set `CLIENT_URL` to the deployed frontend origin.
- Keep `.env` out of version control.

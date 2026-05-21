# StyleDecor Server

## Project Purpose

StyleDecor is a MERN booking platform for home, office, wedding, seminar, and ceremony decoration services. This server provides the secure REST API for authentication, role-based dashboards, bookings, decorator assignment, Stripe payments, revenue, and analytics.

## Live URLs

- Client: `https://styledecor-client-site.vercel.app`
- Server/API: `https://styledecor-server-site.vercel.app`
- Health check: `/health` or `/api/health`

## Key Features

- Firebase-authenticated JWT issuing flow.
- Role-protected APIs for users, admins, and decorators.
- Dedicated MongoDB database name: `styleBD`.
- Service CRUD, booking management, cancellation, and workflow updates.
- Decorator approval, assignment, schedule, project status, earnings, and payments.
- Stripe PaymentIntent creation and server-side payment verification.
- Revenue and service-demand analytics.
- CORS allowlist, Helmet security headers, rate limiting, validation, and centralized error responses.
- Vercel-compatible serverless deployment.

## NPM Packages

Runtime: `cookie-parser`, `cors`, `dotenv`, `express`, `express-rate-limit`, `firebase-admin`, `helmet`, `jsonwebtoken`, `mongodb`, `mongoose`, `stripe`, `zod`.

Development: `nodemon`.

## Server Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The API runs on `http://localhost:5001` by default.

## Environment Variables

```env
PORT=5001
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/styledecor
MONGODB_DB_NAME=styleBD
JWT_SECRET=replace-with-a-long-random-secret
STRIPE_SECRET_KEY=sk_test_replace_me
CLIENT_URL=http://localhost:5173
CLIENT_URLS=http://localhost:5173,https://your-client.vercel.app
ADMIN_EMAIL=dbadmin6432@gmail.com
FIREBASE_PROJECT_ID=replace_me
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@replace_me.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nreplace_me\n-----END PRIVATE KEY-----\n"
```

Instead of `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`, you may set `FIREBASE_SERVICE_ACCOUNT_BASE64` to a base64 encoded Firebase service account JSON.

## Main Endpoints

All endpoints are available at root and with `/api` prefix.

- `POST /jwt`
- `POST /users`, `GET /users`, `GET /users/:email`, `PATCH /users/:id/role`
- `GET /services`, `GET /services/:id`, `POST /services`, `PATCH /services/:id`, `DELETE /services/:id`
- `POST /bookings`, `GET /bookings/my-bookings`, `GET /bookings`, `GET /bookings/:id`
- `PATCH /bookings/:id`, `DELETE /bookings/:id`, `PATCH /bookings/:id/status`
- `PATCH /bookings/:id/assign-decorator`
- `GET /decorators`, `GET /decorators/top`, `PATCH /decorators/:id/status`, `PATCH /decorators/:id`, `DELETE /decorators/:id`
- `GET /decorator/assigned-projects`, `GET /decorator/today-schedule`, `PATCH /decorator/projects/:id/status`
- `GET /decorator/earnings`, `GET /decorator/payments`
- `POST /create-payment-intent`, `POST /payments`, `GET /payments/my-payments`
- `GET /admin/revenue`, `GET /admin/analytics/service-demand`

## Admin Setup

The assignment admin email is `dbadmin6432@gmail.com`. Set `ADMIN_EMAIL` to that value in Vercel and local `.env`. When that Firebase user logs in, the backend profile sync assigns or upgrades the user document to the `admin` role.

## Deployment Notes

- Deploy the server to Vercel.
- Set all server environment variables in Vercel.
- Set `CLIENT_URL` to the exact deployed client origin.
- Add any local or preview origins to `CLIENT_URLS`; CORS no longer allows arbitrary preview domains.
- Use MongoDB Atlas and verify collections are created inside the `styleBD` database.
- Keep `.env` out of version control.
- The server returns `503` for temporary DB connection failure instead of hanging until a 504.

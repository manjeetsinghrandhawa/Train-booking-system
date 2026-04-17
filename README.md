# Train Booking System

This project contains a backend APIs and a React frontend for booking train seats with some strict rules and edge cases.

## Project Structure

- `backend/`: Express APIs with in-memory seat and booking data
- `frontend/`: React (Vite) app for seat map, booking, and cancellation

## How to Run Locally (Step by Step)

1. Clone the repository.
2. Open a terminal in the project root.
3. Install dependency:
   - `npm install`
4. Install backend dependencies:
   - `npm install --prefix backend`
5. Install frontend dependencies:
   - `npm install --prefix frontend`
6. Start backend and frontend together from the root not going into each folder and starting individually:
   - `npm run dev`
7. Open the frontend in your browser:
   - `http://localhost:5173`

Backend runs at `http://localhost:5000`.

## Seat Selection Algorithm (Plain English)

When a user requests seats, the system tries to keep seats as close to the front of the train as possible and follows these rules:

1. Start scanning rows from the front (row 1, row 2, row 3, ...).
2. For each row, if there are no free seats in that row, skip it.
3. If that row alone has enough free seats, assign all requested seats there.
4. If that row does not have enough seats, only check the immediate next row (adjacent row).
5. If current row + adjacent next row together can satisfy the request, split across these two rows.
6. If not, continue scanning from the next row and repeat.
7. If no row or adjacent-row pair can satisfy the request, return an error.

Important behavior:

- A booking is never split across more than 2 rows.
- The split is based on row adjacency, not seat-number proximity alone.
- Booking count is limited to 1 to 7 seats per request.

## Assumptions Made 

1. Data is in-memory only as we are not storing any real dataa in the database like mongodb or postgres.
Reason: keeps implementation simple and fast for the assignment scope

2. Seat state resets on server restart.
Reason: there is no database persistence in this version. So everytime server goes down, it removes all in-memory data

3. Maximum seats per booking is 7.
Reason: this aligns with the backend validation and row-size constraints

4. Frontend booking history is fetched by `userId` entered in the UI.
Reason: this matches available API design (`/bookings/:userId`) in the backedn

## One Thing I Would Do Differently with More Time

I would add persistent storage (for example PostgreSQL) and transactions so concurrent bookings are atomic and safe under high traffic, while preserving the same seat-allocation behavior.

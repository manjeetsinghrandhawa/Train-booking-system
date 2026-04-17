// app.js

import express from "express";
import cors from "cors";

import bookingRoutes from "./src/booking/booking.routes.js";

const app = express();

// Middlewares
app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

// Routes
app.use("/", bookingRoutes);
app.use("/api/v1/bookings", bookingRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Train Booking API running 🚆" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: "Not Found. Check API path or method",
    },
  });
});

// (Optional) error middleware placeholder
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
    },
  });
});

export default app;
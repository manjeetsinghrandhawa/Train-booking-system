import { Router } from "express";

import {
	bookSeatsController,
	cancelBookingController,
	getBookingsByUserController,
	getSeatsController,
} from "./booking.controller.js";

const router = Router();

router.get("/seats", getSeatsController);
router.post("/book", bookSeatsController);
router.post("/cancel", cancelBookingController);
router.get("/bookings/:userId", getBookingsByUserController);

export default router;

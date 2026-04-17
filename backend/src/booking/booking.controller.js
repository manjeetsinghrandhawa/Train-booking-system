import {
	bookings,
	nextBookingId,
	seats,
	TOTAL_SEATS,
} from "../../data/seatStore.js";

export const getSeatsController = (req, res, next) => {
	try {
		const rowsMap = new Map();

		for (const seat of seats) {
			if (!rowsMap.has(seat.rowNumber)) {
				rowsMap.set(seat.rowNumber, {
					rowNumber: seat.rowNumber,
					seats: [],
					freeSeats: [],
				});
			}

			const row = rowsMap.get(seat.rowNumber);
			row.seats.push(seat);

			if (!seat.isBooked) {
				row.freeSeats.push(seat);
			}
		}

		const rows = Array.from(rowsMap.values()).sort((a, b) => a.rowNumber - b.rowNumber);
		const availableSeats = seats.filter((seat) => !seat.isBooked).length;

		return res.status(200).json({
			totalSeats: TOTAL_SEATS,
			availableSeats,
			bookedSeats: TOTAL_SEATS - availableSeats,
			rows: rows.map((row) => ({
				rowNumber: row.rowNumber,
				availableSeats: row.freeSeats.length,
				seats: row.seats.map((seat) => ({
					seatNumber: seat.seatNumber,
					isBooked: seat.isBooked,
				})),
			})),
		});
	} catch (error) {
		return next(error);
	}
};

export const bookSeatsController = (req, res, next) => {
	try {
		const { count, userId } = req.body ?? {};
		const normalizedCount = Number(count);

		if (!Number.isInteger(normalizedCount) || normalizedCount < 1 || normalizedCount > 7) {
			const error = new Error("count must be an integer between 1 and 7");
			error.status = 400;
			return next(error);
		}

		if (typeof userId !== "string" || userId.trim() === "") {
			const error = new Error("userId is required");
			error.status = 400;
			return next(error);
		}

		const rowsMap = new Map();

		for (const seat of seats) {
			if (!rowsMap.has(seat.rowNumber)) {
				rowsMap.set(seat.rowNumber, {
					rowNumber: seat.rowNumber,
					seats: [],
					freeSeats: [],
				});
			}

			const row = rowsMap.get(seat.rowNumber);
			row.seats.push(seat);

			if (!seat.isBooked) {
				row.freeSeats.push(seat);
			}
		}

		const rows = Array.from(rowsMap.values()).sort((a, b) => a.rowNumber - b.rowNumber);

		let selectedSeats = null;

		for (let i = 0; i < rows.length; i += 1) {
			const firstRow = rows[i];

			if (firstRow.freeSeats.length === 0) {
				continue;
			}

			if (firstRow.freeSeats.length >= normalizedCount) {
				selectedSeats = firstRow.freeSeats.slice(0, normalizedCount);
				break;
			}

			const nextRow = rows[i + 1];
			const hasAdjacentNextRow =
				nextRow && nextRow.rowNumber === firstRow.rowNumber + 1;

			if (!hasAdjacentNextRow) {
				continue;
			}

			if (firstRow.freeSeats.length + nextRow.freeSeats.length >= normalizedCount) {
				const remainingCount = normalizedCount - firstRow.freeSeats.length;
				selectedSeats = [
					...firstRow.freeSeats,
					...nextRow.freeSeats.slice(0, remainingCount),
				];
				break;
			}
		}

		if (!selectedSeats || selectedSeats.length !== normalizedCount) {
			const error = new Error(`No 2 adjacent rows has ${normalizedCount} seats`);
			error.status = 409;
			return next(error);
		}

		for (const seat of selectedSeats) {
			seat.isBooked = true;
		}

		const bookingId = nextBookingId();
		const seatNumbers = selectedSeats.map((seat) => seat.seatNumber);
		const rowNumbers = Array.from(new Set(selectedSeats.map((seat) => seat.rowNumber)));

		const booking = {
			bookingId,
			userId: userId.trim(),
			count: normalizedCount,
			seatNumbers,
			rowNumbers,
			createdAt: new Date().toISOString(),
		};

		bookings.set(bookingId, booking);

		return res.status(201).json({
			message: "Booking created successfully",
			...booking,
		});
	} catch (error) {
		return next(error);
	}
};

export const cancelBookingController = (req, res, next) => {
	try {
		const { bookingId } = req.body ?? {};

		if (typeof bookingId !== "string" || bookingId.trim() === "") {
			const error = new Error("bookingId is required");
			error.status = 400;
			return next(error);
		}

		const booking = bookings.get(bookingId);

		if (!booking) {
			const error = new Error("Booking not found");
			error.status = 404;
			return next(error);
		}

		for (const seatNumber of booking.seatNumbers) {
			const seat = seats[seatNumber - 1];

			if (seat) {
				seat.isBooked = false;
			}
		}

		bookings.delete(bookingId);

		return res.status(200).json({
			message: "Booking cancelled successfully",
			bookingId: booking.bookingId,
			seatNumbers: booking.seatNumbers,
		});
	} catch (error) {
		return next(error);
	}
};

export const getBookingsByUserController = (req, res, next) => {
	try {
		const { userId } = req.params;

		if (typeof userId !== "string" || userId.trim() === "") {
			const error = new Error("userId is required");
			error.status = 400;
			return next(error);
		}

		const activeBookings = Array.from(bookings.values()).filter(
			(booking) => booking.userId === userId.trim()
		);

		return res.status(200).json({
			userId,
			bookings: activeBookings,
		});
	} catch (error) {
		return next(error);
	}
};
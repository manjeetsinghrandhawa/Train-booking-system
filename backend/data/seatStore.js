// data/seatStore.js

export const TOTAL_SEATS = 80;
export const SEATS_PER_ROW = 7;
export const FULL_ROWS = Math.floor(TOTAL_SEATS / SEATS_PER_ROW);
export const LAST_ROW_CAPACITY = TOTAL_SEATS - FULL_ROWS * SEATS_PER_ROW;
export const LAST_ROW_NUMBER = FULL_ROWS + (LAST_ROW_CAPACITY > 0 ? 1 : 0);

// Create 80 seats where each row has 7 seats except the last row.
export const seats = Array.from({ length: TOTAL_SEATS }, (_, i) => ({
  seatNumber: i + 1,
  rowNumber: Math.floor(i / SEATS_PER_ROW) + 1,
  isBooked: false,
}));

// Storing bookings in-memory for teh process lifetime
export const bookings = new Map();

let bookingCounter = 1;

export const nextBookingId = () => {
  const id = `b${bookingCounter}`;
  bookingCounter += 1;
  return id;
};
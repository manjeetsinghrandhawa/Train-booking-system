import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_BASE_URL =
   "/api/v1/bookings";
const NEW_BOOKING_HIGHLIGHT_MS = 1600;

const readErrorMessage = async (response) => {
  try {
    const data = await response.json();
    return (
      data?.error?.message ||
      data?.message ||
      `Request failed with status ${response.status}`
    );
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

const App = () => {
  const [userId, setUserId] = useState("u1");
  const [seatCount, setSeatCount] = useState(1);
  const [seatMap, setSeatMap] = useState(null);
  const [bookings, setBookings] = useState([]);

  const [isSeatsLoading, setIsSeatsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [cancelingBookingId, setCancelingBookingId] = useState("");

  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [highlightedSeatNumbers, setHighlightedSeatNumbers] = useState([]);

  const highlightTimeoutRef = useRef(null);

  const highlightedSeatSet = useMemo(
    () => new Set(highlightedSeatNumbers),
    [highlightedSeatNumbers]
  );

  const clearHighlightAfterDelay = useCallback(() => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedSeatNumbers([]);
    }, NEW_BOOKING_HIGHLIGHT_MS);
  }, []);

  const fetchSeatMap = useCallback(async () => {
    setIsSeatsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/seats`);

      if (!response.ok) {
        const message = await readErrorMessage(response);
        throw new Error(message);
      }

      const data = await response.json();
      setSeatMap(data);
    } finally {
      setIsSeatsLoading(false);
    }
  }, []);

  const fetchBookingsForUser = useCallback(async (targetUserId) => {
    const normalizedUserId = targetUserId.trim();

    if (!normalizedUserId) {
      setBookings([]);
      return;
    }

    setIsHistoryLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings/${encodeURIComponent(normalizedUserId)}`
      );

      if (!response.ok) {
        const message = await readErrorMessage(response);
        throw new Error(message);
      }

      const data = await response.json();
      setBookings(Array.isArray(data?.bookings) ? data.bookings : []);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setErrorMessage("");
        await Promise.all([fetchSeatMap(), fetchBookingsForUser(userId)]);
      } catch (error) {
        setErrorMessage(error.message || "Failed to load booking data.");
      }
    };

    loadInitialData();
  }, [fetchSeatMap, fetchBookingsForUser, userId]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const handleBookSeats = async (event) => {
    event.preventDefault();

    const normalizedUserId = userId.trim();
    const normalizedCount = Number(seatCount);

    setErrorMessage("");
    setStatusMessage("");

    if (!normalizedUserId) {
      setErrorMessage("Please enter a userId before booking seats.");
      return;
    }

    if (
      !Number.isInteger(normalizedCount) ||
      normalizedCount < 1 ||
      normalizedCount > 7
    ) {
      setErrorMessage("Seat count must be an integer between 1 and 7.");
      return;
    }

    setIsBooking(true);

    try {
      const response = await fetch(`${API_BASE_URL}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: normalizedUserId,
          count: normalizedCount,
        }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        throw new Error(message);
      }

      const booking = await response.json();

      setHighlightedSeatNumbers(
        Array.isArray(booking.seatNumbers) ? booking.seatNumbers : []
      );
      clearHighlightAfterDelay();

      setStatusMessage(
        `Booking ${booking.bookingId} confirmed for seats ${booking.seatNumbers.join(", ")}.`
      );

      await Promise.all([
        fetchSeatMap(),
        fetchBookingsForUser(normalizedUserId),
      ]);
    } catch (error) {
      setErrorMessage(error.message || "Booking failed.");
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const normalizedUserId = userId.trim();

    setErrorMessage("");
    setStatusMessage("");
    setCancelingBookingId(bookingId);

    try {
      const response = await fetch(`${API_BASE_URL}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        throw new Error(message);
      }

      setStatusMessage(`Booking ${bookingId} cancelled successfully.`);

      await Promise.all([
        fetchSeatMap(),
        fetchBookingsForUser(normalizedUserId),
      ]);
    } catch (error) {
      setErrorMessage(error.message || "Failed to cancel booking.");
    } finally {
      setCancelingBookingId("");
    }
  };

  const handleRefreshHistory = async () => {
    try {
      setErrorMessage("");
      await fetchBookingsForUser(userId);
    } catch (error) {
      setErrorMessage(error.message || "Failed to load booking history.");
    }
  };

  return (
    <div className="page-shell">
      <header className="hero-panel">
        <p className="kicker">Train Booking Dashboard</p>
        <h1>Reserve Seats With Adjacent-Row Rules</h1>
        <p>
          View all 80 seats live, place bookings, and cancel existing reservations
          by booking id.
        </p>
      </header>

      <main className="layout-grid">
        <section className="card controls-card">
          <h2>Create Booking</h2>

          <form className="booking-form" onSubmit={handleBookSeats}>
            <label htmlFor="userId">User ID</label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="u1"
            />

            <label htmlFor="seatCount">Number of Seats (1-7)</label>
            <input
              id="seatCount"
              type="number"
              min="1"
              max="7"
              value={seatCount}
              onChange={(event) => setSeatCount(event.target.value)}
            />

            <div className="form-actions">
              <button type="submit" disabled={isBooking}>
                {isBooking ? "Booking..." : "Book Seats"}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={handleRefreshHistory}
                disabled={isHistoryLoading}
              >
                {isHistoryLoading ? "Loading..." : "Refresh History"}
              </button>
            </div>
          </form>

          {statusMessage ? <p className="status success">{statusMessage}</p> : null}
          {errorMessage ? <p className="status error">{errorMessage}</p> : null}

          <div className="legend">
            <span>
              <i className="dot available" /> Available
            </span>
            <span>
              <i className="dot booked" /> Booked
            </span>
            <span>
              <i className="dot new" /> Newly booked
            </span>
          </div>
        </section>

        <section className="card history-card">
          <div className="card-heading">
            <h2>Booking History</h2>
            <p>{userId.trim() ? `User: ${userId.trim()}` : "Enter a user ID"}</p>
          </div>

          {isHistoryLoading ? <p className="muted">Loading history...</p> : null}

          {!isHistoryLoading && bookings.length === 0 ? (
            <p className="muted">No active bookings for this user.</p>
          ) : null}

          <ul className="history-list">
            {bookings.map((booking) => (
              <li key={booking.bookingId}>
                <div>
                  <strong>{booking.bookingId}</strong>
                  <p>Seats: {booking.seatNumbers.join(", ")}</p>
                  <p>Rows: {booking.rowNumbers.join(", ")}</p>
                </div>
                <button
                  type="button"
                  className="danger"
                  onClick={() => handleCancelBooking(booking.bookingId)}
                  disabled={cancelingBookingId === booking.bookingId}
                >
                  {cancelingBookingId === booking.bookingId
                    ? "Canceling..."
                    : "Cancel"}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card seatmap-card">
          <div className="card-heading">
            <h2>Seat Grid (80 Seats)</h2>
            <p>
              {seatMap
                ? `${seatMap.availableSeats} available / ${seatMap.bookedSeats} booked`
                : "Waiting for seat map"}
            </p>
          </div>

          {isSeatsLoading && !seatMap ? (
            <p className="muted">Loading seat map...</p>
          ) : (
            <div className="seat-rows">
              {(seatMap?.rows ?? []).map((row) => (
                <div className="seat-row" key={row.rowNumber}>
                  <div className="row-tag">Row {row.rowNumber}</div>
                  <div className="row-grid">
                    {row.seats.map((seat) => {
                      const isHighlighted = highlightedSeatSet.has(seat.seatNumber);
                      const stateClass = isHighlighted
                        ? "newly-booked"
                        : seat.isBooked
                        ? "booked"
                        : "available";

                      return (
                        <div
                          className={`seat ${stateClass}`}
                          key={seat.seatNumber}
                          title={`Seat ${seat.seatNumber}`}
                        >
                          {seat.seatNumber}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;

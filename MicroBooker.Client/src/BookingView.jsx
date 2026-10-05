import { useMemo, useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiUsers,
} from "react-icons/fi";
import { toast } from "react-toastify";
import {
  buildBookingDates,
  buildTimeSlots,
  formatClock,
  useAppContext,
} from "./context/AppContext";

const BookingView = ({ onAuthOpen }) => {
  const {
    isLoggedIn,
    restaurant,
    tables,
    bookingLoading,
    bookingRestaurantId,
    refreshBooking,
    isSlotOccupied,
    bookTable,
  } = useAppContext();

  const dates = useMemo(() => buildBookingDates(7), []);
  const [selectedDate, setSelectedDate] = useState(dates[0]?.key || "");
  const [selectedTime, setSelectedTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const timeSlots = useMemo(
    () =>
      buildTimeSlots(
        restaurant?.openingTime ?? restaurant?.OpeningTime,
        restaurant?.closingTime ?? restaurant?.ClosingTime,
      ),
    [restaurant],
  );

  const selectedTable = tables.find(
    (table) => String(table.id ?? table.Id) === String(selectedTableId),
  );

  const suitableTables = tables.filter(
    (table) => Number(table.capacity ?? table.Capacity) >= Number(partySize),
  );

  const handleReserve = async () => {
    if (!isLoggedIn) {
      onAuthOpen();
      toast.info("Sign in to finish your reservation");
      return;
    }

    if (!selectedDate || !selectedTime || !selectedTable) {
      toast.error("Choose a date, time, and table first");
      return;
    }

    try {
      setSubmitting(true);
      await bookTable({
        tableId: selectedTable.id ?? selectedTable.Id,
        date: selectedDate,
        time: selectedTime,
        partySize,
      });
      setSelectedTableId("");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (bookingLoading) {
    return (
      <section className="state-panel">
        <div className="spinner" />
        <h2>Loading restaurant</h2>
        <p>Fetching tables and current availability.</p>
      </section>
    );
  }

  if (!restaurant) {
    return (
      <section className="state-panel">
        <h2>Restaurant unavailable</h2>
        <p>
          The configured restaurant could not be loaded. Current restaurant ID:
        </p>
        <code>{bookingRestaurantId || "Not configured"}</code>
        <button className="primary-button" type="button" onClick={refreshBooking}>
          <FiRefreshCw />
          Try again
        </button>
      </section>
    );
  }

  return (
    <div className="booking-page">
      <section className="restaurant-hero">
        <div>
          <span className="eyebrow">Now accepting reservations</span>
          <h1>{restaurant.name}</h1>
          <p>
            Pick a time, party size, and one of the available tables. The
            availability shown here comes directly from the reservation API.
          </p>
          <div className="restaurant-meta">
            <span><FiMapPin /> {restaurant.address}</span>
            <span><FiPhone /> {restaurant.phone}</span>
            <span>
              <FiClock />
              {formatClock((restaurant.openingTime || "").slice(0, 5))} –{" "}
              {formatClock((restaurant.closingTime || "").slice(0, 5))}
            </span>
          </div>
        </div>
        <div className="hero-stat">
          <strong>{tables.length}</strong>
          <span>active tables</span>
        </div>
      </section>

      <section className="booking-workspace">
        <div className="booking-controls card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Step 1</span>
              <h2>Choose your visit</h2>
            </div>
            <FiCalendar />
          </div>

          <div className="date-strip">
            {dates.map((date) => (
              <button
                type="button"
                key={date.key}
                className={selectedDate === date.key ? "active" : ""}
                onClick={() => {
                  setSelectedDate(date.key);
                  setSelectedTableId("");
                }}
              >
                <span>{date.weekday}</span>
                <strong>{date.label}</strong>
              </button>
            ))}
          </div>

          <label className="field">
            <span><FiUsers /> Party size</span>
            <select
              value={partySize}
              onChange={(event) => {
                setPartySize(Number(event.target.value));
                setSelectedTableId("");
              }}
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((size) => (
                <option key={size} value={size}>
                  {size} {size === 1 ? "guest" : "guests"}
                </option>
              ))}
            </select>
          </label>

          <div className="field">
            <span><FiClock /> Time</span>
            <div className="time-grid">
              {timeSlots.map((time) => {
                const everySuitableTableOccupied =
                  suitableTables.length > 0 &&
                  suitableTables.every((table) =>
                    isSlotOccupied(
                      table.id ?? table.Id,
                      selectedDate,
                      time,
                    ),
                  );

                return (
                  <button
                    type="button"
                    key={time}
                    className={selectedTime === time ? "active" : ""}
                    disabled={everySuitableTableOccupied}
                    onClick={() => {
                      setSelectedTime(time);
                      setSelectedTableId("");
                    }}
                  >
                    {formatClock(time)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="table-picker card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Step 2</span>
              <h2>Select a table</h2>
            </div>
            <span className="availability-key">
              <i /> Available
            </span>
          </div>

          {!selectedTime ? (
            <div className="empty-card">
              <FiClock />
              <p>Choose a time to see table availability.</p>
            </div>
          ) : suitableTables.length === 0 ? (
            <div className="empty-card">
              <FiUsers />
              <p>No table can seat a party of {partySize}.</p>
            </div>
          ) : (
            <div className="table-grid">
              {suitableTables.map((table) => {
                const id = table.id ?? table.Id;
                const number = table.tableNumber ?? table.TableNumber;
                const capacity = table.capacity ?? table.Capacity;
                const occupied = isSlotOccupied(id, selectedDate, selectedTime);
                const selected = String(selectedTableId) === String(id);
                const classes =
                  "table-card" +
                  (selected ? " selected" : "") +
                  (occupied ? " occupied" : "");

                return (
                  <button
                    type="button"
                    key={id}
                    disabled={occupied}
                    className={classes}
                    onClick={() => setSelectedTableId(id)}
                  >
                    <span className="table-shape">T{number}</span>
                    <strong>Table {number}</strong>
                    <small>{capacity} seats</small>
                    <em>{occupied ? "Reserved" : "Available"}</em>
                  </button>
                );
              })}
            </div>
          )}

          <div className="booking-summary">
            <div>
              <span>Selection</span>
              <strong>
                {selectedTable
                  ? "Table " + (selectedTable.tableNumber ?? selectedTable.TableNumber)
                  : "No table selected"}
              </strong>
              <small>
                {selectedDate && selectedTime
                  ? selectedDate + " · " + formatClock(selectedTime) + " · " + partySize + " guests"
                  : "Complete the visit details above"}
              </small>
            </div>
            <button
              type="button"
              className="primary-button reserve-button"
              disabled={!selectedTable || submitting}
              onClick={handleReserve}
            >
              {submitting ? "Creating reservation..." : "Reserve table"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookingView;

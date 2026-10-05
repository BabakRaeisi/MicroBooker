import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiPhone,
  FiUsers,
} from "react-icons/fi";
import { toast } from "react-toastify";
import {
  buildBookingDates,
  buildTimeSlots,
  formatClock,
  useAppContext,
} from "./context/AppContext";

const BookingView = ({ restaurantId, onBack, onAuthOpen }) => {
  const {
    isLoggedIn,
    currentUser,
    setBookingRestaurantId,
    restaurant,
    tables,
    bookingLoading,
    isSlotOccupied,
    bookTable,
  } = useAppContext();

  const dates = useMemo(() => buildBookingDates(7), []);
  const [selectedDate, setSelectedDate] = useState(dates[0]?.key || "");
  const [selectedTime, setSelectedTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setBookingRestaurantId(restaurantId);
  }, [restaurantId, setBookingRestaurantId]);

  const operatingHours =
    restaurant?.operatingHours ?? restaurant?.OperatingHours ?? [];

  const getScheduleForDate = (dateKey) => {
    const dayName = new Date(dateKey + "T12:00:00").toLocaleDateString(
      "en-US",
      { weekday: "long" },
    );

    return operatingHours.find(
      (item) => (item.dayOfWeek ?? item.DayOfWeek) === dayName,
    );
  };

  const selectedSchedule = getScheduleForDate(selectedDate);

  const timeSlots = useMemo(
    () =>
      selectedSchedule
        ? buildTimeSlots(
            selectedSchedule.openingTime ?? selectedSchedule.OpeningTime,
            selectedSchedule.closingTime ?? selectedSchedule.ClosingTime,
          )
        : [],
    [selectedDate, restaurant],
  );

  const suitableTables = tables.filter(
    (table) => Number(table.capacity ?? table.Capacity) >= Number(partySize),
  );

  const selectedTable = suitableTables.find(
    (table) => String(table.id ?? table.Id) === String(selectedTableId),
  );

  const handleReserve = async () => {
    if (!isLoggedIn) {
      onAuthOpen();
      toast.info("Sign in to finish your reservation");
      return;
    }

    if (currentUser?.role === "Partner") {
      toast.error(
        "Partner accounts cannot make reservations. Sign in with a customer account.",
      );
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

  if (bookingLoading || !restaurant) {
    return (
      <section className="state-panel">
        <div className="spinner" />
        <h2>Loading restaurant</h2>
        <p>Fetching restaurant details and availability.</p>
      </section>
    );
  }

  const todayName = new Date().toLocaleDateString("en-US", {
    weekday: "long",
  });
  const todayHours = operatingHours.find(
    (item) => (item.dayOfWeek ?? item.DayOfWeek) === todayName,
  );

  return (
    <div className="booking-page">
      <button type="button" className="back-link" onClick={onBack}>
        <FiArrowLeft />
        All restaurants
      </button>

      <section className="restaurant-hero">
        <div>
          <span className="eyebrow">Restaurant on MicroBooker</span>
          <h1>{restaurant.name ?? restaurant.Name}</h1>
          <div className="restaurant-meta">
            <span>
              <FiMapPin />
              {restaurant.address ?? restaurant.Address}
            </span>
            <span>
              <FiPhone />
              {restaurant.phone ?? restaurant.Phone}
            </span>
            <span>
              <FiClock />
              {todayHours
                ? "Today " +
                  formatClock(
                    (todayHours.openingTime ?? todayHours.OpeningTime).slice(
                      0,
                      5,
                    ),
                  ) +
                  " – " +
                  formatClock(
                    (todayHours.closingTime ?? todayHours.ClosingTime).slice(
                      0,
                      5,
                    ),
                  )
                : "Closed today"}
            </span>
          </div>
        </div>
        <div className="hero-stat">
          <strong>{tables.length}</strong>
          <span>tables available</span>
        </div>
      </section>

      <section className="booking-workspace">
        <div className="booking-controls card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Your visit</span>
              <h2>Date, time & party</h2>
            </div>
            <FiCalendar />
          </div>

          <div className="date-strip">
            {dates.map((date) => {
              const isOpen = Boolean(getScheduleForDate(date.key));

              return (
                <button
                  type="button"
                  key={date.key}
                  disabled={!isOpen}
                  className={
                    (selectedDate === date.key ? "active" : "") +
                    (!isOpen ? " closed-day" : "")
                  }
                  onClick={() => {
                    setSelectedDate(date.key);
                    setSelectedTime("");
                    setSelectedTableId("");
                  }}
                >
                  <span>{date.weekday}</span>
                  <strong>{date.label}</strong>
                  {!isOpen && <small>Closed</small>}
                </button>
              );
            })}
          </div>

          <label className="field">
            <span>
              <FiUsers />
              Party size
            </span>
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
            <span>
              <FiClock />
              Time
            </span>
            {!selectedSchedule ? (
              <div className="closed-day-message">
                This restaurant is closed on the selected day.
              </div>
            ) : (
            <div className="time-grid">
              {timeSlots.map((time) => {
                const fullyBooked =
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
                    disabled={fullyBooked}
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
            )}
          </div>
        </div>

        <div className="table-picker card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Available seating</span>
              <h2>Choose a table</h2>
            </div>
          </div>

          {!selectedTime ? (
            <div className="empty-card">
              <FiClock />
              <p>Choose a time to see available tables.</p>
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

                return (
                  <button
                    type="button"
                    key={id}
                    disabled={occupied}
                    className={
                      "table-card" +
                      (selected ? " selected" : "") +
                      (occupied ? " occupied" : "")
                    }
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
              <span>Reservation</span>
              <strong>
                {selectedTable
                  ? "Table " +
                    (selectedTable.tableNumber ?? selectedTable.TableNumber)
                  : "Choose a table"}
              </strong>
              <small>
                {selectedDate && selectedTime
                  ? selectedDate +
                    " · " +
                    formatClock(selectedTime) +
                    " · " +
                    partySize +
                    " guests"
                  : "Select your visit details"}
              </small>
            </div>
            <button
              type="button"
              className="primary-button reserve-button"
              disabled={
                !selectedTable ||
                submitting ||
                currentUser?.role === "Partner"
              }
              onClick={handleReserve}
            >
              {currentUser?.role === "Partner"
                ? "Customer account required"
                : submitting
                  ? "Reserving..."
                  : "Reserve table"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookingView;

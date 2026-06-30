import { sidebarDates } from "./tablesData";
import { useAppContext } from "./context/AppContext";

const Sidebar = () => {
  const {
    selectedDateId,
    selectedTime,
    isSubmitting,
    selectedTable,
    setSelectedDateId,
    setSelectedTime,
    handleReserve,
    isTimeBookedForSelectedTable,
  } = useAppContext();

  const selectedDate =
    sidebarDates.find((date) => String(date.id) === String(selectedDateId)) ||
    sidebarDates[0];

  // Supports different property names from tablesData
  const availableTimes =
    selectedDate?.times ?? selectedDate?.timeSlots ?? selectedDate?.slots ?? [];

  return (
    <section className="sidebar-container">
      <div className="sidebar-content">
        <h4 className="sidebar-title">Reserve your table</h4>

        <h4 className="sidebar-section">Available dates</h4>
        <ul className="sidebar-dates">
          {sidebarDates.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedDateId(item.id);
                  setSelectedTime(null);
                }}
                className={selectedDateId === item.id ? "active" : ""}
              >
                <span>{item.dayOfWeek}</span>
                <span>{item.dayLabel}</span>
              </button>
            </li>
          ))}
        </ul>

        <h4 className="sidebar-section">Pick time</h4>
        <p className="sidebar-subtitle">
          {selectedTable
            ? `Times for ${selectedTable.tableNumber.replaceAll("_", " ")}`
            : "Select a table to see availability"}
        </p>

        <ul className="sidebar-time">
          {availableTimes.length === 0 ? (
            <li>No times configured for this date.</li>
          ) : (
            availableTimes.map((time) => {
              const isBooked = isTimeBookedForSelectedTable(time);
              return (
                <li key={time}>
                  <button
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={selectedTime === time ? "active" : ""}
                    disabled={isBooked}
                    title={
                      isBooked ? "Already booked for selected table/date" : time
                    }
                  >
                    {time}
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <button
          type="button"
          className="reserve-btn"
          onClick={handleReserve}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Reserving..." : "Reserve"}
        </button>
      </div>
    </section>
  );
};

export default Sidebar;

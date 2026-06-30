import restaurantTables from "./tablesData";
import { useAppContext } from "./context/AppContext";

const tableLayout = [
  { top: "18%", left: "20%" },
  { top: "18%", left: "50%" },
  { top: "18%", left: "80%" },
  { top: "55%", left: "25%" },
  { top: "55%", left: "60%" },
  { top: "80%", left: "40%" },
];

const Tables = () => {
  const { selectedTableId, handleSelectTable, isTableBooked, selectedTime } =
    useAppContext();
  const visibleTables = restaurantTables.slice(0, tableLayout.length);

  return (
    <section className="restaurant-floor">
      {visibleTables.map((table, index) => {
        const position = tableLayout[index];
        const isActive = selectedTableId === table.id;
        const isBooked = isTableBooked(table.tableNumber); // only true when a time is selected

        return (
          <button
            key={table.id}
            type="button"
            className={`restaurant-table ${isActive ? "active" : ""} ${isBooked ? "booked" : ""}`}
            style={{ top: position.top, left: position.left }}
            onClick={() => handleSelectTable(table)}
            disabled={isBooked}
            title={
              isBooked && selectedTime
                ? `${table.tableNumber} is booked at ${selectedTime}`
                : `${table.tableNumber} • ${table.capacity} seats`
            }
          >
            <span className="table-icon">{table.icon}</span>
            <span className="table-number">
              {table.tableNumber.replaceAll("_", " ")}
            </span>
            <span className="table-capacity">{table.capacity} seats</span>
          </button>
        );
      })}
    </section>
  );
};

export default Tables;

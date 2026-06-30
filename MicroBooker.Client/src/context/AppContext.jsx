/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "react-toastify";
import restaurantTables, { sidebarDates } from "../tablesData";
import { createReservation, getReservations } from "../api/reservationsApi";

const AppContext = createContext(null);

const normalizeReservation = (r) => ({
  tableId: r?.tableId ?? r?.TableId ?? "",
  timeSlot: r?.timeSlot ?? r?.TimeSlot ?? "",
});

const to24Hour = (time12h) => {
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export const AppProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [currentUser, setCurrentUser] = useState(null); // { id, name, email }

  const [selectedDateId, setSelectedDateId] = useState(
    sidebarDates[0]?.id || null,
  );
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservations, setReservations] = useState([]);

  const selectedDate =
    sidebarDates.find((date) => String(date.id) === String(selectedDateId)) ??
    sidebarDates[0];

  const selectedTable =
    restaurantTables.find((table) => table.id === selectedTableId) ?? null;

  const loadReservations = useCallback(async () => {
    try {
      const data = await getReservations();
      setReservations(
        Array.isArray(data) ? data.map(normalizeReservation) : [],
      );
    } catch {
      toast.error("Failed to load reservations");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReservations();
  }, [loadReservations]);

  const bookedKeys = useMemo(
    () =>
      new Set(
        reservations
          .filter((r) => r.tableId && r.timeSlot)
          .map((r) => `${r.tableId}|${r.timeSlot}`),
      ),
    [reservations],
  );

  const getBookedTimesForTableOnDate = useCallback(
    (tableNumber, dateStr) => {
      const prefix = `${dateStr}T`;
      return reservations
        .filter(
          (r) => r.tableId === tableNumber && r.timeSlot.startsWith(prefix),
        )
        .map((r) => r.timeSlot.slice(11, 16)); // HH:mm
    },
    [reservations],
  );

  const isTableBooked = useCallback(
    (tableNumber) => {
      if (!selectedDate || !selectedTime) return false;
      const slot = `${selectedDate.date}T${to24Hour(selectedTime)}:00`;
      return bookedKeys.has(`${tableNumber}|${slot}`);
    },
    [bookedKeys, selectedDate, selectedTime],
  );

  const isTimeBookedForSelectedTable = useCallback(
    (time12h) => {
      if (!selectedTable || !selectedDate) return false;
      const hhmm = to24Hour(time12h);
      const bookedTimes = getBookedTimesForTableOnDate(
        selectedTable.tableNumber,
        selectedDate.date,
      );
      return bookedTimes.includes(hhmm);
    },
    [selectedTable, selectedDate, getBookedTimesForTableOnDate],
  );

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_name");
    setIsLoggedIn(false);
    setUserName("");
    setCurrentUser(null);
  };

  const handleSelectTable = (table) => {
    if (isTableBooked(table.tableNumber)) {
      return toast.error("This table is already booked for selected date/time");
    }
    setSelectedTableId(table.id);
    toast.info(`${table.tableNumber.replaceAll("_", " ")} selected`);
  };

  const handleReserve = async () => {
    if (!isLoggedIn) {
      return toast.error("Please log in first");
    }

    if (!currentUser?.id) {
      return toast.error("User session missing id. Please login again.");
    }

    if (!selectedTable) return toast.error("Please select a table");
    if (!selectedDate) return toast.error("Please select a date");
    if (!selectedTime) return toast.error("Please select a time");
    if (isTableBooked(selectedTable.tableNumber)) {
      return toast.error(
        "This slot is already taken. Pick another time/table.",
      );
    }

    const payload = {
      customerId: currentUser.id,
      restaurantId: "demo-restaurant-1",
      tableId: selectedTable.tableNumber,
      timeSlot: `${selectedDate.date}T${to24Hour(selectedTime)}:00`,
      partySize: selectedTable.capacity,
    };

    try {
      setIsSubmitting(true);
      await createReservation(payload);
      await loadReservations();
      toast.success(
        `Reserved ${selectedTable.tableNumber.replaceAll("_", " ")} for ${selectedDate.dayOfWeek}, ${selectedDate.dayLabel} at ${selectedTime}`,
      );
    } catch (error) {
      const message =
        error?.response?.data?.message || "Reservation failed. Try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const value = {
    isLoggedIn,
    setIsLoggedIn,
    userName,
    setUserName,
    currentUser,
    setCurrentUser,
    handleLogout,

    selectedTableId,
    selectedDateId,
    selectedTime,
    isSubmitting,
    selectedDate,
    selectedTable,
    reservations,

    handleSelectTable,
    setSelectedDateId,
    setSelectedTime,
    handleReserve,

    isTableBooked,
    isTimeBookedForSelectedTable,
    getBookedTimesForTableOnDate,
    loadReservations,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
};

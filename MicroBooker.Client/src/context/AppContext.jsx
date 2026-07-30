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
const RESERVATION_REFRESH_INTERVAL_MS = 5000;

const normalizeReservation = (reservation) => ({
  tableId: reservation?.tableId ?? reservation?.TableId ?? "",
  timeSlot: reservation?.timeSlot ?? reservation?.TimeSlot ?? "",
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
  const [currentUser, setCurrentUser] = useState(null);

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

  const loadReservations = useCallback(async (showError = true) => {
    try {
      const data = await getReservations();

      setReservations(
        Array.isArray(data) ? data.map(normalizeReservation) : [],
      );
    } catch {
      if (showError) {
        toast.error("Failed to load reservations");
      }
    }
  }, []);

  useEffect(() => {
    void loadReservations();

    const refreshReservations = () => {
      void loadReservations(false);
    };

    const intervalId = window.setInterval(
      refreshReservations,
      RESERVATION_REFRESH_INTERVAL_MS,
    );

    window.addEventListener("focus", refreshReservations);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshReservations);
    };
  }, [loadReservations]);

  const bookedKeys = useMemo(
    () =>
      new Set(
        reservations
          .filter((reservation) => reservation.tableId && reservation.timeSlot)
          .map(
            (reservation) => `${reservation.tableId}|${reservation.timeSlot}`,
          ),
      ),
    [reservations],
  );

  const getBookedTimesForTableOnDate = useCallback(
    (tableNumber, dateString) => {
      const prefix = `${dateString}T`;

      return reservations
        .filter(
          (reservation) =>
            reservation.tableId === tableNumber &&
            reservation.timeSlot.startsWith(prefix),
        )
        .map((reservation) => reservation.timeSlot.slice(11, 16));
    },
    [reservations],
  );

  const isTableBooked = useCallback(
    (tableNumber) => {
      if (!selectedDate || !selectedTime) return false;

      const timeSlot = `${selectedDate.date}T${to24Hour(selectedTime)}:00`;

      return bookedKeys.has(`${tableNumber}|${timeSlot}`);
    },
    [bookedKeys, selectedDate, selectedTime],
  );

  const isTimeBookedForSelectedTable = useCallback(
    (time12h) => {
      if (!selectedTable || !selectedDate) return false;

      const time24h = to24Hour(time12h);
      const bookedTimes = getBookedTimesForTableOnDate(
        selectedTable.tableNumber,
        selectedDate.date,
      );

      return bookedTimes.includes(time24h);
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
      toast.error("This table is already booked for selected date/time");
      return;
    }

    setSelectedTableId(table.id);
    toast.info(`${table.tableNumber.replaceAll("_", " ")} selected`);
  };

  const handleReserve = async () => {
    if (!isLoggedIn) {
      toast.error("Please log in first");
      return;
    }

    if (!currentUser?.id) {
      toast.error("User session missing id. Please login again.");
      return;
    }

    if (!selectedTable) {
      toast.error("Please select a table");
      return;
    }

    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    if (!selectedTime) {
      toast.error("Please select a time");
      return;
    }

    if (isTableBooked(selectedTable.tableNumber)) {
      toast.error("This slot is already taken. Pick another time/table.");
      return;
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

      const createdReservation = normalizeReservation(
        await createReservation(payload),
      );

      if (createdReservation.tableId && createdReservation.timeSlot) {
        const createdKey = `${createdReservation.tableId}|${createdReservation.timeSlot}`;

        setReservations((currentReservations) => [
          createdReservation,
          ...currentReservations.filter(
            (reservation) =>
              `${reservation.tableId}|${reservation.timeSlot}` !== createdKey,
          ),
        ]);
      }

      toast.success(
        `Reserved ${selectedTable.tableNumber.replaceAll("_", " ")} for ${selectedDate.dayOfWeek}, ${selectedDate.dayLabel} at ${selectedTime}`,
      );
    } catch (error) {
      const message =
        error?.response?.data?.message || "Reservation failed. Try again.";

      toast.error(message);

      // Refresh in case another user booked the slot first.
      void loadReservations(false);
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
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }

  return context;
};

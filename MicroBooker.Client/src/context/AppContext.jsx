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
import { sidebarDates } from "../tablesData";
import { createReservation } from "../api/reservationsApi";
import {
  getRestaurantAvailability,
  getRestaurantTables,
} from "../api/restaurantsApi";

const AppContext = createContext(null);
const AVAILABILITY_REFRESH_INTERVAL_MS = 5000;
const RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID || "";

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

const toLocalDateKey = (date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

const toLocalTimeKey = (date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

const buildLocalDateTimeOffset = (dateString, time12h) => {
  const time24h = to24Hour(time12h);
  const localDate = new Date(`${dateString}T${time24h}:00`);

  const offsetMinutes = -localDate.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0");
  const offsetMins = String(absoluteOffset % 60).padStart(2, "0");

  return `${dateString}T${time24h}:00${sign}${offsetHours}:${offsetMins}`;
};

export const AppProvider = ({ children }) => {
  const storedToken = localStorage.getItem("access_token");
  const storedUserName = localStorage.getItem("user_name") || "";
  const storedUserId = localStorage.getItem("user_id") || "";

  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(storedToken));
  const [userName, setUserName] = useState(storedUserName);
  const [currentUser, setCurrentUser] = useState(
    storedUserId
      ? { id: storedUserId, name: storedUserName, email: "" }
      : null,
  );

  const [restaurantTables, setRestaurantTables] = useState([]);
  const [selectedDateId, setSelectedDateId] = useState(
    sidebarDates[0]?.id || null,
  );
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [reservations, setReservations] = useState([]);

  const selectedDate =
    sidebarDates.find((date) => String(date.id) === String(selectedDateId)) ??
    sidebarDates[0];

  const selectedTable =
    restaurantTables.find((table) => table.id === selectedTableId) ?? null;

  const loadAvailability = useCallback(
    async (showError = true) => {
      if (!RESTAURANT_ID) return;

      try {
        const data = await getRestaurantAvailability(RESTAURANT_ID);

        setReservations(
          Array.isArray(data) ? data.map(normalizeReservation) : [],
        );
      } catch {
        if (showError) {
          toast.error("Failed to load table availability");
        }
      }
    },
    [],
  );

  const loadTables = useCallback(async () => {
    if (!RESTAURANT_ID) {
      setIsLoadingTables(false);
      toast.error("Restaurant id is not configured");
      return;
    }

    try {
      const data = await getRestaurantTables(RESTAURANT_ID);
      setRestaurantTables(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load restaurant tables");
      setRestaurantTables([]);
    } finally {
      setIsLoadingTables(false);
    }
  }, []);

  useEffect(() => {
    void loadTables();
    void loadAvailability();

    const refreshAvailability = () => {
      void loadAvailability(false);
    };

    const intervalId = window.setInterval(
      refreshAvailability,
      AVAILABILITY_REFRESH_INTERVAL_MS,
    );

    window.addEventListener("focus", refreshAvailability);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshAvailability);
    };
  }, [loadAvailability, loadTables]);

  const reservationSlots = useMemo(
    () =>
      reservations
        .map((reservation) => {
          const parsedDate = new Date(reservation.timeSlot);

          if (
            !reservation.tableId ||
            !reservation.timeSlot ||
            Number.isNaN(parsedDate.getTime())
          ) {
            return null;
          }

          return {
            tableId: String(reservation.tableId),
            date: toLocalDateKey(parsedDate),
            time: toLocalTimeKey(parsedDate),
          };
        })
        .filter(Boolean),
    [reservations],
  );

  const getBookedTimesForTableOnDate = useCallback(
    (tableId, dateString) =>
      reservationSlots
        .filter(
          (slot) =>
            slot.tableId === String(tableId) && slot.date === dateString,
        )
        .map((slot) => slot.time),
    [reservationSlots],
  );

  const isTableBooked = useCallback(
    (tableId) => {
      if (!selectedDate || !selectedTime) return false;

      const time24h = to24Hour(selectedTime);

      return reservationSlots.some(
        (slot) =>
          slot.tableId === String(tableId) &&
          slot.date === selectedDate.date &&
          slot.time === time24h,
      );
    },
    [reservationSlots, selectedDate, selectedTime],
  );

  const isTimeBookedForSelectedTable = useCallback(
    (time12h) => {
      if (!selectedTable || !selectedDate) return false;

      const time24h = to24Hour(time12h);
      const bookedTimes = getBookedTimesForTableOnDate(
        selectedTable.id,
        selectedDate.date,
      );

      return bookedTimes.includes(time24h);
    },
    [selectedTable, selectedDate, getBookedTimesForTableOnDate],
  );

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_id");
    setIsLoggedIn(false);
    setUserName("");
    setCurrentUser(null);
  };

  const handleSelectTable = (table) => {
    if (isTableBooked(table.id)) {
      toast.error("This table is already booked for selected date/time");
      return;
    }

    setSelectedTableId(table.id);
    toast.info(`Table ${table.tableNumber} selected`);
  };

  const handleReserve = async () => {
    if (!isLoggedIn) {
      toast.error("Please log in first");
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

    if (isTableBooked(selectedTable.id)) {
      toast.error("This slot is already taken. Pick another time/table.");
      return;
    }

    const payload = {
      restaurantId: RESTAURANT_ID,
      tableId: selectedTable.id,
      timeSlot: buildLocalDateTimeOffset(selectedDate.date, selectedTime),
      partySize: selectedTable.capacity,
    };

    try {
      setIsSubmitting(true);

      const createdReservation = normalizeReservation(
        await createReservation(payload),
      );

      if (createdReservation.tableId && createdReservation.timeSlot) {
        setReservations((currentReservations) => [
          createdReservation,
          ...currentReservations,
        ]);
      }

      toast.success(
        `Reserved Table ${selectedTable.tableNumber} for ${selectedDate.dayOfWeek}, ${selectedDate.dayLabel} at ${selectedTime}`,
      );
    } catch (error) {
      const message =
        error?.response?.data?.message || "Reservation failed. Try again.";

      toast.error(message);
      void loadAvailability(false);
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

    restaurantId: RESTAURANT_ID,
    restaurantTables,
    isLoadingTables,
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
    loadAvailability,
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

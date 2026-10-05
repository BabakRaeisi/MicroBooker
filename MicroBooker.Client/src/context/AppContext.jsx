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
import {
  createAdminTable,
  createRestaurant,
  getAdminTables,
  getRestaurantAvailability,
  getRestaurantById,
  getRestaurantTables,
} from "../api/restaurantsApi";
import {
  createReservation,
  getAdminReservations,
  updateReservationStatus,
} from "../api/reservationsApi";

const AppContext = createContext(null);
const DEFAULT_RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID || "";

const apiMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.title ||
  error?.message ||
  fallback;

const localDateKey = (date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

const localTimeKey = (date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;

const toDateTimeOffset = (dateKey, timeKey) => {
  const localDate = new Date(`${dateKey}T${timeKey}:00`);
  const offsetMinutes = -localDate.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const minutes = String(absolute % 60).padStart(2, "0");
  return `${dateKey}T${timeKey}:00${sign}${hours}:${minutes}`;
};

export const buildBookingDates = (count = 7) =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + index);

    return {
      key: localDateKey(date),
      weekday: date.toLocaleDateString("en-CA", { weekday: "short" }),
      label: date.toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
      }),
    };
  });

export const formatClock = (value) => {
  if (!value) return "";
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date(2000, 0, 1, hours, minutes);
  return date.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
  });
};

export const buildTimeSlots = (openingTime, closingTime, interval = 30) => {
  if (!openingTime || !closingTime) return [];

  const toMinutes = (value) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const opening = toMinutes(openingTime);
  let closing = toMinutes(closingTime);

  if (closing <= opening) closing += 24 * 60;

  const slots = [];
  for (let minute = opening; minute < closing; minute += interval) {
    const normalized = minute % (24 * 60);
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    slots.push(
      `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    );
  }

  return slots;
};

export const AppProvider = ({ children }) => {
  const storedToken = localStorage.getItem("access_token");
  const storedName = localStorage.getItem("user_name") || "";
  const storedUserId = localStorage.getItem("user_id") || "";

  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(storedToken));
  const [userName, setUserName] = useState(storedName);
  const [currentUser, setCurrentUser] = useState(
    storedUserId ? { id: storedUserId, name: storedName, email: "" } : null,
  );

  const [bookingRestaurantId, setBookingRestaurantIdState] = useState(
    localStorage.getItem("booking_restaurant_id") || DEFAULT_RESTAURANT_ID,
  );
  const [adminRestaurantId, setAdminRestaurantIdState] = useState(
    localStorage.getItem("admin_restaurant_id") || DEFAULT_RESTAURANT_ID,
  );

  const [restaurant, setRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(true);

  const [adminRestaurant, setAdminRestaurant] = useState(null);
  const [adminTables, setAdminTables] = useState([]);
  const [adminReservations, setAdminReservations] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const setBookingRestaurantId = useCallback((restaurantId) => {
    const value = restaurantId?.trim() || "";
    setBookingRestaurantIdState(value);
    if (value) localStorage.setItem("booking_restaurant_id", value);
    else localStorage.removeItem("booking_restaurant_id");
  }, []);

  const setAdminRestaurantId = useCallback((restaurantId) => {
    const value = restaurantId?.trim() || "";
    setAdminRestaurantIdState(value);
    if (value) localStorage.setItem("admin_restaurant_id", value);
    else localStorage.removeItem("admin_restaurant_id");
  }, []);

  const refreshBooking = useCallback(
    async (showError = true, showLoading = false) => {
      if (!bookingRestaurantId) {
        setRestaurant(null);
        setTables([]);
        setAvailability([]);
        setBookingLoading(false);
        return;
      }

      if (showLoading) setBookingLoading(true);

      try {
        const [restaurantData, tableData, availabilityData] = await Promise.all([
          getRestaurantById(bookingRestaurantId),
          getRestaurantTables(bookingRestaurantId),
          getRestaurantAvailability(bookingRestaurantId),
        ]);

        setRestaurant(restaurantData);
        setTables(Array.isArray(tableData) ? tableData : []);
        setAvailability(Array.isArray(availabilityData) ? availabilityData : []);
      } catch (error) {
        if (showError) toast.error(apiMessage(error, "Could not load restaurant"));
      } finally {
        if (showLoading) setBookingLoading(false);
      }
    },
    [bookingRestaurantId],
  );

  useEffect(() => {
    void refreshBooking(true, true);
  }, [refreshBooking]);

  const occupiedSlots = useMemo(
    () =>
      availability
        .map((reservation) => {
          const rawTime = reservation.timeSlot ?? reservation.TimeSlot;
          const tableId = reservation.tableId ?? reservation.TableId;
          const date = rawTime ? new Date(rawTime) : null;

          if (!tableId || !date || Number.isNaN(date.getTime())) return null;

          return {
            tableId: String(tableId),
            date: localDateKey(date),
            time: localTimeKey(date),
            status: reservation.status ?? reservation.Status,
          };
        })
        .filter(Boolean),
    [availability],
  );

  const isSlotOccupied = useCallback(
    (tableId, date, time) =>
      occupiedSlots.some(
        (slot) =>
          slot.tableId === String(tableId) &&
          slot.date === date &&
          slot.time === time,
      ),
    [occupiedSlots],
  );

  const bookTable = useCallback(
    async ({ tableId, date, time, partySize }) => {
      if (!isLoggedIn) {
        throw new Error("Please log in before making a reservation.");
      }

      const payload = {
        restaurantId: bookingRestaurantId,
        tableId,
        timeSlot: toDateTimeOffset(date, time),
        partySize: Number(partySize),
      };

      try {
        const reservation = await createReservation(payload);
        toast.success("Reservation created. Status: Pending");
        await refreshBooking(false, false);
        return reservation;
      } catch (error) {
        throw new Error(apiMessage(error, "Reservation failed"));
      }
    },
    [bookingRestaurantId, isLoggedIn, refreshBooking],
  );

  const loadAdminRestaurant = useCallback(
    async (restaurantId = adminRestaurantId, showError = true) => {
      const id = restaurantId?.trim();
      if (!id) {
        setAdminRestaurant(null);
        setAdminTables([]);
        setAdminReservations([]);
        return false;
      }

      try {
        setAdminLoading(true);
        const restaurantData = await getRestaurantById(id);
        const [tableData, reservationData] = await Promise.all([
          getAdminTables(id),
          getAdminReservations(id),
        ]);

        setAdminRestaurantId(id);
        setAdminRestaurant(restaurantData);
        setAdminTables(Array.isArray(tableData) ? tableData : []);
        setAdminReservations(
          Array.isArray(reservationData) ? reservationData : [],
        );
        return true;
      } catch (error) {
        setAdminRestaurant(null);
        setAdminTables([]);
        setAdminReservations([]);
        if (showError) {
          const status = error?.response?.status;
          toast.error(
            status === 403
              ? "This restaurant exists, but the signed-in user is not its owner."
              : apiMessage(error, "Could not load admin restaurant"),
          );
        }
        return false;
      } finally {
        setAdminLoading(false);
      }
    },
    [adminRestaurantId, setAdminRestaurantId],
  );

  const createOwnedRestaurant = useCallback(
    async (payload) => {
      try {
        const created = await createRestaurant(payload);
        const id = created.id ?? created.Id;
        setAdminRestaurantId(id);
        setBookingRestaurantId(id);
        setAdminRestaurant(created);
        setRestaurant(created);
        setAdminTables([]);
        setAdminReservations([]);
        toast.success("Restaurant created");
        return created;
      } catch (error) {
        throw new Error(apiMessage(error, "Could not create restaurant"));
      }
    },
    [setAdminRestaurantId, setBookingRestaurantId],
  );

  const addAdminTable = useCallback(
    async (payload) => {
      if (!adminRestaurantId) throw new Error("Load a restaurant first.");

      try {
        const created = await createAdminTable(adminRestaurantId, payload);
        await Promise.all([
          loadAdminRestaurant(adminRestaurantId, false),
          bookingRestaurantId === adminRestaurantId
            ? refreshBooking(false, false)
            : Promise.resolve(),
        ]);
        toast.success(`Table ${created.tableNumber ?? created.TableNumber} added`);
        return created;
      } catch (error) {
        throw new Error(apiMessage(error, "Could not create table"));
      }
    },
    [
      adminRestaurantId,
      bookingRestaurantId,
      loadAdminRestaurant,
      refreshBooking,
    ],
  );

  const changeReservationStatus = useCallback(
    async (reservationId, status) => {
      if (!adminRestaurantId) return;

      try {
        const updated = await updateReservationStatus(
          adminRestaurantId,
          reservationId,
          status,
        );

        setAdminReservations((current) =>
          current.map((reservation) =>
            (reservation.id ?? reservation.Id) === reservationId
              ? updated
              : reservation,
          ),
        );

        if (bookingRestaurantId === adminRestaurantId) {
          await refreshBooking(false, false);
        }

        toast.success(`Reservation marked ${status}`);
      } catch (error) {
        throw new Error(apiMessage(error, "Could not update reservation"));
      }
    },
    [adminRestaurantId, bookingRestaurantId, refreshBooking],
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_id");
    setIsLoggedIn(false);
    setUserName("");
    setCurrentUser(null);
    setAdminRestaurant(null);
    setAdminTables([]);
    setAdminReservations([]);
  }, []);

  const value = {
    isLoggedIn,
    setIsLoggedIn,
    userName,
    setUserName,
    currentUser,
    setCurrentUser,
    handleLogout,

    bookingRestaurantId,
    setBookingRestaurantId,
    restaurant,
    tables,
    availability,
    bookingLoading,
    refreshBooking,
    isSlotOccupied,
    bookTable,

    adminRestaurantId,
    setAdminRestaurantId,
    adminRestaurant,
    adminTables,
    adminReservations,
    adminLoading,
    loadAdminRestaurant,
    createOwnedRestaurant,
    addAdminTable,
    changeReservationStatus,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used inside AppProvider");
  return context;
};

import http from "./http";

export const createReservation = async (payload) => {
  const { data } = await http.post("/api/reservations", payload);
  return data;
};

export const getAdminReservations = async (restaurantId) => {
  const { data } = await http.get(
    `/api/admin/restaurants/${restaurantId}/reservations`,
  );
  return data;
};

export const updateReservationStatus = async (
  restaurantId,
  reservationId,
  status,
) => {
  const { data } = await http.patch(
    `/api/admin/restaurants/${restaurantId}/reservations/${reservationId}/status`,
    { status },
  );
  return data;
};

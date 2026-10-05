import http from "./http";

export const createReservation = async (payload) => {
  const { data } = await http.post("/api/reservations", payload);
  return data;
};

import http from "./http";

export const createReservation = async (payload) => {
  const { data } = await http.post("/api/reservations", payload);
  return data;
};

export const getReservations = async () => {
  const { data } = await http.get("/api/reservations");
  return data;
};

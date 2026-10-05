import http from "./http";

export const getRestaurants = async () => {
  const { data } = await http.get("/api/restaurants");
  return data;
};

export const createRestaurant = async (payload) => {
  const { data } = await http.post("/api/restaurants", payload);
  return data;
};

export const getRestaurantById = async (restaurantId) => {
  const { data } = await http.get(`/api/restaurants/${restaurantId}`);
  return data;
};

export const getRestaurantTables = async (restaurantId) => {
  const { data } = await http.get(`/api/restaurants/${restaurantId}/tables`);
  return data;
};

export const getRestaurantAvailability = async (restaurantId) => {
  const { data } = await http.get(
    `/api/restaurants/${restaurantId}/availability`,
  );
  return data;
};

export const getOwnedRestaurants = async () => {
  const { data } = await http.get("/api/admin/restaurants");
  return data;
};

export const getAdminTables = async (restaurantId) => {
  const { data } = await http.get(
    `/api/admin/restaurants/${restaurantId}/tables`,
  );
  return data;
};

export const createAdminTable = async (restaurantId, payload) => {
  const { data } = await http.post(
    `/api/admin/restaurants/${restaurantId}/tables`,
    payload,
  );
  return data;
};

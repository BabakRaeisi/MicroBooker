import http from "./http";

export const getRestaurantTables = async (restaurantId) => {
  const { data } = await http.get(`/api/Restaurants/${restaurantId}/tables`);
  return data;
};

export const getRestaurantAvailability = async (restaurantId) => {
  const { data } = await http.get(
    `/api/Restaurants/${restaurantId}/availability`,
  );
  return data;
};

import { useEffect, useMemo, useState } from "react";
import {
  FiArrowRight,
  FiClock,
  FiMapPin,
  FiSearch,
} from "react-icons/fi";
import {
  formatClock,
  useAppContext,
} from "./context/AppContext";

const CustomerHome = ({ onOpenRestaurant }) => {
  const {
    restaurantDirectory,
    directoryLoading,
    loadRestaurantDirectory,
  } = useAppContext();
  const [query, setQuery] = useState("");

  useEffect(() => {
    void loadRestaurantDirectory();
  }, [loadRestaurantDirectory]);

  const visibleRestaurants = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return restaurantDirectory;

    return restaurantDirectory.filter((restaurant) =>
      [restaurant.name, restaurant.address, restaurant.slug]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [query, restaurantDirectory]);

  return (
    <div className="marketplace-page">
      <section className="marketplace-hero">
        <span className="eyebrow">Restaurant reservations, simplified</span>
        <h1>Find your next table.</h1>
        <p>
          Browse restaurants, see their hours, and reserve a table without
          calling or waiting for confirmation by phone.
        </p>

        <label className="restaurant-search">
          <FiSearch />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search restaurants or locations"
          />
        </label>
      </section>

      <section className="directory-section">
        <div className="directory-heading">
          <div>
            <span className="eyebrow">Explore</span>
            <h2>Restaurants on MicroBooker</h2>
          </div>
          <span>{visibleRestaurants.length} restaurants</span>
        </div>

        {directoryLoading ? (
          <div className="directory-grid">
            {[1, 2, 3].map((item) => (
              <div className="restaurant-card skeleton-card" key={item} />
            ))}
          </div>
        ) : visibleRestaurants.length === 0 ? (
          <div className="empty-directory card">
            <h3>No restaurants found</h3>
            <p>
              {query
                ? "Try a different search."
                : "Restaurants will appear here after owners publish them."}
            </p>
          </div>
        ) : (
          <div className="directory-grid">
            {visibleRestaurants.map((restaurant) => {
              const id = restaurant.id ?? restaurant.Id;
              const operatingHours =
                restaurant.operatingHours ?? restaurant.OperatingHours ?? [];
              const todayName = new Date().toLocaleDateString("en-US", {
                weekday: "long",
              });
              const todayHours = operatingHours.find(
                (item) => (item.dayOfWeek ?? item.DayOfWeek) === todayName,
              );

              return (
                <article className="restaurant-card" key={id}>
                  <div className="restaurant-card-banner">
                    <span>{restaurant.name.slice(0, 1).toUpperCase()}</span>
                  </div>
                  <div className="restaurant-card-body">
                    <div>
                      <span className="eyebrow">Available to book</span>
                      <h3>{restaurant.name}</h3>
                    </div>
                    <p>
                      <FiMapPin />
                      {restaurant.address}
                    </p>
                    <p>
                      <FiClock />
                      {todayHours
                        ? "Today " +
                          formatClock(
                            (
                              todayHours.openingTime ??
                              todayHours.OpeningTime
                            ).slice(0, 5),
                          ) +
                          " – " +
                          formatClock(
                            (
                              todayHours.closingTime ??
                              todayHours.ClosingTime
                            ).slice(0, 5),
                          )
                        : "Closed today"}
                    </p>
                    <button
                      type="button"
                      className="restaurant-card-action"
                      onClick={() => onOpenRestaurant(id)}
                    >
                      View & book
                      <FiArrowRight />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default CustomerHome;

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
              const opening = restaurant.openingTime ?? restaurant.OpeningTime;
              const closing = restaurant.closingTime ?? restaurant.ClosingTime;

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
                      {formatClock((opening || "").slice(0, 5))}
                      {" – "}
                      {formatClock((closing || "").slice(0, 5))}
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

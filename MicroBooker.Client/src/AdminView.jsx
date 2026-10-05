import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClipboard,
  FiExternalLink,
  FiPlus,
  FiRefreshCw,
  FiSettings,
  FiUsers,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { formatClock, useAppContext } from "./context/AppContext";

const STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "Cancelled",
  "Completed",
  "NoShow",
];

const emptyRestaurant = {
  name: "",
  slug: "",
  address: "",
  phone: "",
  openingTime: "10:00",
  closingTime: "22:00",
};

const AdminView = ({ onAuthOpen, onViewRestaurant }) => {
  const {
    isLoggedIn,
    ownedRestaurants,
    ownedRestaurantsLoading,
    loadOwnedRestaurants,
    adminRestaurantId,
    adminRestaurant,
    adminTables,
    adminReservations,
    adminLoading,
    loadAdminRestaurant,
    createOwnedRestaurant,
    addAdminTable,
    changeReservationStatus,
  } = useAppContext();

  const [showCreate, setShowCreate] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState(emptyRestaurant);
  const [tableForm, setTableForm] = useState({ tableNumber: 1, capacity: 2 });
  const [creatingRestaurant, setCreatingRestaurant] = useState(false);
  const [creatingTable, setCreatingTable] = useState(false);
  const [statusBusy, setStatusBusy] = useState("");

  useEffect(() => {
    if (isLoggedIn) {
      void loadOwnedRestaurants(false);
    }
  }, [isLoggedIn, loadOwnedRestaurants]);

  const counts = useMemo(() => {
    const result = {
      Pending: 0,
      Confirmed: 0,
      Cancelled: 0,
      Completed: 0,
    };

    adminReservations.forEach((reservation) => {
      const status = reservation.status ?? reservation.Status;
      if (status in result) result[status] += 1;
    });

    return result;
  }, [adminReservations]);

  if (!isLoggedIn) {
    return (
      <section className="partner-welcome">
        <div className="partner-welcome-copy">
          <span className="eyebrow">MicroBooker Partners</span>
          <h1>Run your reservations from one place.</h1>
          <p>
            The partner portal is separate from the customer booking experience.
            Restaurant owners can create locations, manage tables, review
            reservations, and update booking status here.
          </p>
          <button type="button" className="primary-button" onClick={onAuthOpen}>
            <FiSettings />
            Partner sign in or register
          </button>
        </div>

        <div className="partner-feature-grid">
          <article>
            <FiUsers />
            <strong>Table management</strong>
            <span>Create and review restaurant tables.</span>
          </article>
          <article>
            <FiClipboard />
            <strong>Reservation queue</strong>
            <span>Review incoming bookings and change their status.</span>
          </article>
          <article>
            <FiCheckCircle />
            <strong>Multiple restaurants</strong>
            <span>One owner account can manage more than one restaurant.</span>
          </article>
        </div>
      </section>
    );
  }

  const handleCreateRestaurant = async (event) => {
    event.preventDefault();

    try {
      setCreatingRestaurant(true);

      await createOwnedRestaurant({
        ...restaurantForm,
        openingTime: restaurantForm.openingTime + ":00",
        closingTime: restaurantForm.closingTime + ":00",
      });

      setRestaurantForm(emptyRestaurant);
      setShowCreate(false);
      await loadOwnedRestaurants(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCreatingRestaurant(false);
    }
  };

  const handleCreateTable = async (event) => {
    event.preventDefault();

    try {
      setCreatingTable(true);

      await addAdminTable({
        tableNumber: Number(tableForm.tableNumber),
        capacity: Number(tableForm.capacity),
      });

      setTableForm((current) => ({
        tableNumber: Number(current.tableNumber) + 1,
        capacity: current.capacity,
      }));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCreatingTable(false);
    }
  };

  const handleStatus = async (reservationId, status) => {
    try {
      setStatusBusy(reservationId);
      await changeReservationStatus(reservationId, status);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setStatusBusy("");
    }
  };

  if (!adminRestaurant) {
    return (
      <div className="partner-dashboard">
        <section className="partner-dashboard-header">
          <div>
            <span className="eyebrow">Partner portal</span>
            <h1>My restaurants</h1>
            <p>
              Choose a restaurant to manage it, or add another location to your
              account.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() => setShowCreate((value) => !value)}
          >
            <FiPlus />
            Add restaurant
          </button>
        </section>

        {showCreate && (
          <section className="create-restaurant card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">New restaurant</span>
                <h2>Create a restaurant</h2>
              </div>
              <FiPlus />
            </div>

            <form className="form-grid" onSubmit={handleCreateRestaurant}>
              <label className="field">
                <span>Name</span>
                <input
                  required
                  value={restaurantForm.name}
                  onChange={(event) =>
                    setRestaurantForm({
                      ...restaurantForm,
                      name: event.target.value,
                    })
                  }
                  placeholder="Harbour Table"
                />
              </label>

              <label className="field">
                <span>Slug</span>
                <input
                  required
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  value={restaurantForm.slug}
                  onChange={(event) =>
                    setRestaurantForm({
                      ...restaurantForm,
                      slug: event.target.value,
                    })
                  }
                  placeholder="harbour-table"
                />
              </label>

              <label className="field field-wide">
                <span>Address</span>
                <input
                  required
                  value={restaurantForm.address}
                  onChange={(event) =>
                    setRestaurantForm({
                      ...restaurantForm,
                      address: event.target.value,
                    })
                  }
                  placeholder="100 Main Street"
                />
              </label>

              <label className="field">
                <span>Phone</span>
                <input
                  required
                  value={restaurantForm.phone}
                  onChange={(event) =>
                    setRestaurantForm({
                      ...restaurantForm,
                      phone: event.target.value,
                    })
                  }
                  placeholder="+1 416 555 1234"
                />
              </label>

              <label className="field">
                <span>Opening time</span>
                <input
                  type="time"
                  required
                  value={restaurantForm.openingTime}
                  onChange={(event) =>
                    setRestaurantForm({
                      ...restaurantForm,
                      openingTime: event.target.value,
                    })
                  }
                />
              </label>

              <label className="field">
                <span>Closing time</span>
                <input
                  type="time"
                  required
                  value={restaurantForm.closingTime}
                  onChange={(event) =>
                    setRestaurantForm({
                      ...restaurantForm,
                      closingTime: event.target.value,
                    })
                  }
                />
              </label>

              <div className="form-actions field-wide">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={creatingRestaurant}
                >
                  <FiPlus />
                  {creatingRestaurant ? "Creating..." : "Create restaurant"}
                </button>
              </div>
            </form>
          </section>
        )}

        {ownedRestaurantsLoading ? (
          <section className="state-panel compact-state">
            <div className="spinner" />
            <p>Loading your restaurants...</p>
          </section>
        ) : ownedRestaurants.length === 0 ? (
          <section className="empty-owner-state card">
            <FiSettings />
            <h2>No restaurants yet</h2>
            <p>
              Create your first restaurant to start managing tables and
              reservations.
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowCreate(true)}
            >
              <FiPlus />
              Create first restaurant
            </button>
          </section>
        ) : (
          <section className="owner-restaurant-grid">
            {ownedRestaurants.map((restaurant) => {
              const id = restaurant.id ?? restaurant.Id;
              const opening =
                restaurant.openingTime ?? restaurant.OpeningTime;
              const closing =
                restaurant.closingTime ?? restaurant.ClosingTime;

              return (
                <article className="owner-restaurant-card" key={id}>
                  <div className="owner-card-top">
                    <span className="owner-card-mark">
                      {restaurant.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span>Owner access</span>
                  </div>

                  <h2>{restaurant.name}</h2>
                  <p>{restaurant.address}</p>

                  <div className="owner-card-hours">
                    {formatClock((opening || "").slice(0, 5))}
                    {" – "}
                    {formatClock((closing || "").slice(0, 5))}
                  </div>

                  <div className="owner-card-actions">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => loadAdminRestaurant(id)}
                    >
                      Manage
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => onViewRestaurant(id)}
                    >
                      <FiExternalLink />
                      Public page
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="admin-page">
      <button
        type="button"
        className="back-link"
        onClick={() => loadAdminRestaurant("")}
      >
        <FiArrowLeft />
        My restaurants
      </button>

      <section className="restaurant-admin-card card">
        <div className="restaurant-admin-details">
          <span className="eyebrow">Managing restaurant</span>
          <h1>{adminRestaurant.name}</h1>
          <p>{adminRestaurant.address}</p>
          <div className="admin-detail-row">
            <span>{adminRestaurant.phone}</span>
            <span>
              {formatClock(
                (adminRestaurant.openingTime || "").slice(0, 5),
              )}
              {" – "}
              {formatClock(
                (adminRestaurant.closingTime || "").slice(0, 5),
              )}
            </span>
          </div>
        </div>

        <div className="restaurant-admin-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onViewRestaurant(adminRestaurantId)}
          >
            <FiExternalLink />
            View public page
          </button>

          <button
            type="button"
            className="ghost-button"
            disabled={adminLoading}
            onClick={() => loadAdminRestaurant(adminRestaurantId)}
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </section>

      <section className="admin-summary-grid">
        <article className="metric-card">
          <span>Tables</span>
          <strong>{adminTables.length}</strong>
          <small>configured</small>
        </article>
        <article className="metric-card">
          <span>Pending</span>
          <strong>{counts.Pending}</strong>
          <small>need review</small>
        </article>
        <article className="metric-card">
          <span>Confirmed</span>
          <strong>{counts.Confirmed}</strong>
          <small>upcoming</small>
        </article>
        <article className="metric-card">
          <span>Completed</span>
          <strong>{counts.Completed}</strong>
          <small>finished</small>
        </article>
      </section>

      <div className="admin-columns">
        <section className="card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Floor setup</span>
              <h2>Tables</h2>
            </div>
            <FiUsers />
          </div>

          <form className="inline-form" onSubmit={handleCreateTable}>
            <label className="field">
              <span>Table number</span>
              <input
                type="number"
                min="1"
                required
                value={tableForm.tableNumber}
                onChange={(event) =>
                  setTableForm({
                    ...tableForm,
                    tableNumber: event.target.value,
                  })
                }
              />
            </label>

            <label className="field">
              <span>Capacity</span>
              <input
                type="number"
                min="1"
                required
                value={tableForm.capacity}
                onChange={(event) =>
                  setTableForm({
                    ...tableForm,
                    capacity: event.target.value,
                  })
                }
              />
            </label>

            <button
              type="submit"
              className="primary-button"
              disabled={creatingTable}
            >
              <FiPlus />
              {creatingTable ? "Adding..." : "Add table"}
            </button>
          </form>

          <div className="admin-table-cards">
            {adminTables.length === 0 ? (
              <div className="empty-card">
                <FiUsers />
                <p>No tables configured yet.</p>
              </div>
            ) : (
              adminTables.map((table) => (
                <article
                  key={table.id ?? table.Id}
                  className="admin-table-card"
                >
                  <span>T{table.tableNumber ?? table.TableNumber}</span>
                  <div>
                    <strong>
                      Table {table.tableNumber ?? table.TableNumber}
                    </strong>
                    <small>{table.capacity ?? table.Capacity} seats</small>
                  </div>
                  <em>
                    {(table.isActive ?? table.IsActive)
                      ? "Active"
                      : "Inactive"}
                  </em>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="card reservations-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Bookings</span>
              <h2>Reservations</h2>
            </div>
            <FiClipboard />
          </div>

          {adminReservations.length === 0 ? (
            <div className="empty-card">
              <FiClipboard />
              <p>No reservations yet.</p>
            </div>
          ) : (
            <div className="reservation-list">
              {adminReservations.map((reservation) => {
                const id = reservation.id ?? reservation.Id;
                const status =
                  reservation.status ?? reservation.Status;
                const date = new Date(
                  reservation.timeSlot ?? reservation.TimeSlot,
                );

                const table = adminTables.find(
                  (item) =>
                    String(item.id ?? item.Id) ===
                    String(
                      reservation.tableId ?? reservation.TableId,
                    ),
                );

                return (
                  <article className="reservation-row" key={id}>
                    <div>
                      <strong>
                        {date.toLocaleDateString("en-CA", {
                          month: "short",
                          day: "numeric",
                        })}
                        {" · "}
                        {date.toLocaleTimeString("en-CA", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </strong>

                      <span>
                        Table{" "}
                        {table?.tableNumber ??
                          table?.TableNumber ??
                          "—"}{" "}
                        ·{" "}
                        {reservation.partySize ??
                          reservation.PartySize}{" "}
                        guests
                      </span>

                      <small>
                        Customer{" "}
                        {String(
                          reservation.customerId ??
                            reservation.CustomerId,
                        ).slice(0, 8)}
                        …
                      </small>
                    </div>

                    <select
                      className={
                        "status-select status-" +
                        String(status).toLowerCase()
                      }
                      value={status}
                      disabled={statusBusy === id}
                      onChange={(event) =>
                        handleStatus(id, event.target.value)
                      }
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminView;

import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClipboard,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiUsers,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { formatClock, useAppContext } from "./context/AppContext";

const STATUS_OPTIONS = ["Pending", "Confirmed", "Cancelled", "Completed", "NoShow"];

const emptyRestaurant = {
  name: "",
  slug: "",
  address: "",
  phone: "",
  openingTime: "10:00",
  closingTime: "22:00",
};

const AdminView = ({ onAuthOpen }) => {
  const {
    isLoggedIn,
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
    setBookingRestaurantId,
  } = useAppContext();

  const [lookupId, setLookupId] = useState(adminRestaurantId);
  const [restaurantForm, setRestaurantForm] = useState(emptyRestaurant);
  const [tableForm, setTableForm] = useState({ tableNumber: 1, capacity: 2 });
  const [creatingRestaurant, setCreatingRestaurant] = useState(false);
  const [creatingTable, setCreatingTable] = useState(false);
  const [statusBusy, setStatusBusy] = useState("");

  useEffect(() => {
    setLookupId(adminRestaurantId);
  }, [adminRestaurantId]);

  useEffect(() => {
    if (isLoggedIn && adminRestaurantId) {
      void loadAdminRestaurant(adminRestaurantId, false);
    }
  }, [isLoggedIn, adminRestaurantId, loadAdminRestaurant]);

  const counts = useMemo(() => {
    const result = { Pending: 0, Confirmed: 0, Cancelled: 0 };
    adminReservations.forEach((reservation) => {
      const status = reservation.status ?? reservation.Status;
      if (status in result) result[status] += 1;
    });
    return result;
  }, [adminReservations]);

  if (!isLoggedIn) {
    return (
      <section className="state-panel admin-signin">
        <FiSettings />
        <h2>Restaurant administration</h2>
        <p>
          Sign in with the restaurant owner account to create restaurants,
          manage tables, review reservations, and change reservation status.
        </p>
        <button type="button" className="primary-button" onClick={onAuthOpen}>
          Sign in to continue
        </button>
      </section>
    );
  }

  const handleLookup = async (event) => {
    event.preventDefault();
    const id = lookupId.trim();
    if (!id) return;
    setAdminRestaurantId(id);
    await loadAdminRestaurant(id);
  };

  const handleCreateRestaurant = async (event) => {
    event.preventDefault();
    try {
      setCreatingRestaurant(true);
      const created = await createOwnedRestaurant({
        ...restaurantForm,
        openingTime: restaurantForm.openingTime + ":00",
        closingTime: restaurantForm.closingTime + ":00",
      });
      const id = created.id ?? created.Id;
      setLookupId(id);
      setRestaurantForm(emptyRestaurant);
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

  return (
    <div className="admin-page">
      <section className="admin-topbar card">
        <div>
          <span className="eyebrow">Owner workspace</span>
          <h1>Restaurant admin</h1>
          <p>Every action below maps directly to the owner-protected API.</p>
        </div>
        <form className="restaurant-lookup" onSubmit={handleLookup}>
          <label>
            Restaurant ID
            <input
              value={lookupId}
              onChange={(event) => setLookupId(event.target.value)}
              placeholder="Paste restaurant GUID"
            />
          </label>
          <button type="submit" className="secondary-button" disabled={adminLoading}>
            <FiSearch />
            {adminLoading ? "Loading..." : "Load"}
          </button>
        </form>
      </section>

      {!adminRestaurant ? (
        <section className="create-restaurant card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">POST /api/Restaurants</span>
              <h2>Create your restaurant</h2>
            </div>
            <FiPlus />
          </div>
          <p className="section-copy">
            If the loaded restaurant is not owned by this account, create a new
            one here. It becomes the active booking restaurant automatically.
          </p>

          <form className="form-grid" onSubmit={handleCreateRestaurant}>
            <label className="field">
              <span>Name</span>
              <input
                required
                value={restaurantForm.name}
                onChange={(event) =>
                  setRestaurantForm({ ...restaurantForm, name: event.target.value })
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
                  setRestaurantForm({ ...restaurantForm, slug: event.target.value })
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
                  setRestaurantForm({ ...restaurantForm, phone: event.target.value })
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
      ) : (
        <>
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
              <span>Cancelled</span>
              <strong>{counts.Cancelled}</strong>
              <small>on record</small>
            </article>
          </section>

          <section className="restaurant-admin-card card">
            <div className="restaurant-admin-details">
              <span className="eyebrow">GET /api/Restaurants/{id}</span>
              <h2>{adminRestaurant.name}</h2>
              <p>{adminRestaurant.address}</p>
              <div className="admin-detail-row">
                <span>{adminRestaurant.phone}</span>
                <span>
                  {formatClock((adminRestaurant.openingTime || "").slice(0, 5))}
                  {" – "}
                  {formatClock((adminRestaurant.closingTime || "").slice(0, 5))}
                </span>
              </div>
            </div>
            <div className="restaurant-admin-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setBookingRestaurantId(adminRestaurantId);
                  toast.success("This restaurant is now active in Book view");
                }}
              >
                <FiCheckCircle />
                Use in booking view
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => loadAdminRestaurant(adminRestaurantId)}
              >
                <FiRefreshCw />
                Refresh
              </button>
            </div>
          </section>

          <div className="admin-columns">
            <section className="card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Owner tables</span>
                  <h2>Table management</h2>
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
                    <p>No tables yet.</p>
                  </div>
                ) : (
                  adminTables.map((table) => (
                    <article key={table.id ?? table.Id} className="admin-table-card">
                      <span>T{table.tableNumber ?? table.TableNumber}</span>
                      <div>
                        <strong>Table {table.tableNumber ?? table.TableNumber}</strong>
                        <small>{table.capacity ?? table.Capacity} seats</small>
                      </div>
                      <em>
                        {(table.isActive ?? table.IsActive) ? "Active" : "Inactive"}
                      </em>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="card reservations-card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Owner reservations</span>
                  <h2>Reservation queue</h2>
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
                    const status = reservation.status ?? reservation.Status;
                    const date = new Date(
                      reservation.timeSlot ?? reservation.TimeSlot,
                    );
                    const table = adminTables.find(
                      (item) =>
                        String(item.id ?? item.Id) ===
                        String(reservation.tableId ?? reservation.TableId),
                    );
                    const statusClass =
                      "status-select status-" + String(status).toLowerCase();

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
                            Table {table?.tableNumber ?? table?.TableNumber ?? "—"} ·{" "}
                            {reservation.partySize ?? reservation.PartySize} guests
                          </span>
                          <small>
                            Customer {String(reservation.customerId ?? reservation.CustomerId).slice(0, 8)}…
                          </small>
                        </div>
                        <select
                          className={statusClass}
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
        </>
      )}
    </div>
  );
};

export default AdminView;

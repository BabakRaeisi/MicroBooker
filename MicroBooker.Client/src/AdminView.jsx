import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClipboard,
  FiExternalLink,
  FiPlus,
  FiRefreshCw,
  FiSettings,
  FiTrash2,
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

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const createSchedule = () =>
  DAYS.map((day) => ({
    dayOfWeek: day,
    isOpen: true,
    openingTime: "10:00",
    closingTime: "22:00",
  }));

const emptyRestaurant = () => ({
  name: "",
  address: "",
  phone: "",
  operatingHours: createSchedule(),
});

const emptyTable = (tableNumber = 1) => ({
  tableNumber,
  capacity: 2,
});

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

  const [setupStep, setSetupStep] = useState(0);
  const [restaurantForm, setRestaurantForm] = useState(emptyRestaurant);
  const [setupTables, setSetupTables] = useState([emptyTable()]);
  const [savingTables, setSavingTables] = useState(false);
  const [setupRestaurantSaved, setSetupRestaurantSaved] = useState(false);
  const [tableForm, setTableForm] = useState(emptyTable());
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

  const beginSetup = () => {
    setRestaurantForm(emptyRestaurant());
    setSetupTables([emptyTable()]);
    setSetupRestaurantSaved(false);
    setSetupStep(1);
  };

  const updateSchedule = (index, changes) => {
    setRestaurantForm((current) => ({
      ...current,
      operatingHours: current.operatingHours.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item,
      ),
    }));
  };

  const handleRestaurantDetails = (event) => {
    event.preventDefault();

    const openDays = restaurantForm.operatingHours.filter(
      (item) => item.isOpen,
    );

    if (openDays.length === 0) {
      toast.error("Select at least one operating day.");
      return;
    }

    const invalidHours = openDays.some(
      (item) => item.closingTime <= item.openingTime,
    );

    if (invalidHours) {
      toast.error("Closing time must be later than opening time.");
      return;
    }

    setSetupStep(2);
  };

  const updateSetupTable = (index, changes) => {
    setSetupTables((current) =>
      current.map((table, tableIndex) =>
        tableIndex === index ? { ...table, ...changes } : table,
      ),
    );
  };

  const addSetupTableRow = () => {
    setSetupTables((current) => [
      ...current,
      emptyTable(
        current.length === 0
          ? 1
          : Math.max(...current.map((table) => Number(table.tableNumber))) + 1,
      ),
    ]);
  };

  const removeSetupTableRow = (index) => {
    setSetupTables((current) =>
      current.length === 1
        ? current
        : current.filter((_, tableIndex) => tableIndex !== index),
    );
  };

  const finishTableSetup = async (event) => {
    event.preventDefault();

    const normalizedTables = setupTables.map((table) => ({
      tableNumber: Number(table.tableNumber),
      capacity: Number(table.capacity),
    }));

    const tableNumbers = normalizedTables.map((table) => table.tableNumber);
    if (new Set(tableNumbers).size !== tableNumbers.length) {
      toast.error("Table numbers must be unique.");
      return;
    }

    try {
      setSavingTables(true);

      if (!setupRestaurantSaved) {
        const operatingHours = restaurantForm.operatingHours
          .filter((item) => item.isOpen)
          .map((item) => ({
            dayOfWeek: item.dayOfWeek,
            openingTime: item.openingTime + ":00",
            closingTime: item.closingTime + ":00",
          }));

        await createOwnedRestaurant({
          name: restaurantForm.name.trim(),
          address: restaurantForm.address.trim(),
          phone: restaurantForm.phone.trim(),
          operatingHours,
        });

        setSetupRestaurantSaved(true);
      }

      const existingTableNumbers = new Set(
        adminTables.map((table) =>
          Number(table.tableNumber ?? table.TableNumber),
        ),
      );

      for (const table of normalizedTables) {
        if (existingTableNumbers.has(table.tableNumber)) continue;

        await addAdminTable(table);
        existingTableNumbers.add(table.tableNumber);
      }

      await loadOwnedRestaurants(false);
      setSetupStep(0);
      setSetupRestaurantSaved(false);
      toast.success("Restaurant setup complete");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingTables(false);
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

      toast.success("Table added");
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

  if (!isLoggedIn) {
    return (
      <section className="partner-welcome">
        <div className="partner-welcome-copy">
          <span className="eyebrow">MicroBooker Partners</span>
          <h1>Manage your restaurant, not your booking spreadsheet.</h1>
          <p>
            Create an owner account first. After signing in, you will set up
            your restaurant details, weekly operating schedule, tables, and
            seat capacities.
          </p>
          <button type="button" className="primary-button" onClick={onAuthOpen}>
            <FiSettings />
            Partner sign in or register
          </button>
        </div>

        <div className="partner-feature-grid">
          <article>
            <FiSettings />
            <strong>Restaurant setup</strong>
            <span>Name, address, phone, operating days, and opening hours.</span>
          </article>
          <article>
            <FiUsers />
            <strong>Tables & seats</strong>
            <span>Define every table and its seating capacity.</span>
          </article>
          <article>
            <FiClipboard />
            <strong>Reservations</strong>
            <span>Review bookings and update reservation status.</span>
          </article>
        </div>
      </section>
    );
  }

  if (setupStep > 0 || (!ownedRestaurantsLoading && ownedRestaurants.length === 0 && !adminRestaurant)) {
    const activeStep = setupStep || 1;

    return (
      <div className="onboarding-page">
        <section className="onboarding-header">
          <div>
            <span className="eyebrow">Restaurant onboarding</span>
            <h1>Set up your restaurant</h1>
            <p>
              Your owner account is separate from the restaurant. Add the
              business and floor details here.
            </p>
          </div>

          <div className="setup-progress" aria-label="Setup progress">
            <span className={activeStep >= 1 ? "active" : ""}>1</span>
            <i />
            <span className={activeStep >= 2 ? "active" : ""}>2</span>
          </div>
        </section>

        {activeStep === 1 ? (
          <form className="setup-card card" onSubmit={handleRestaurantDetails}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">Step 1 of 2</span>
                <h2>Restaurant details</h2>
              </div>
              <FiSettings />
            </div>

            <div className="setup-details-grid">
              <label className="field">
                <span>Restaurant name</span>
                <input
                  required
                  maxLength="100"
                  value={restaurantForm.name}
                  onChange={(event) =>
                    setRestaurantForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Harbour Table"
                />
              </label>

              <label className="field">
                <span>Phone number</span>
                <input
                  required
                  maxLength="30"
                  value={restaurantForm.phone}
                  onChange={(event) =>
                    setRestaurantForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="+1 416 555 1234"
                />
              </label>

              <label className="field setup-address">
                <span>Restaurant address</span>
                <input
                  required
                  maxLength="200"
                  value={restaurantForm.address}
                  onChange={(event) =>
                    setRestaurantForm((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                  placeholder="100 Main Street, Vaughan, ON"
                />
              </label>
            </div>

            <div className="schedule-section">
              <div className="schedule-heading">
                <div>
                  <h3>Operating days & hours</h3>
                  <p>Turn off days when the restaurant is closed.</p>
                </div>
              </div>

              <div className="schedule-list">
                {restaurantForm.operatingHours.map((item, index) => (
                  <div
                    className={"schedule-row" + (!item.isOpen ? " closed" : "")}
                    key={item.dayOfWeek}
                  >
                    <label className="day-toggle">
                      <input
                        type="checkbox"
                        checked={item.isOpen}
                        onChange={(event) =>
                          updateSchedule(index, { isOpen: event.target.checked })
                        }
                      />
                      <span>{item.dayOfWeek}</span>
                    </label>

                    {item.isOpen ? (
                      <div className="schedule-times">
                        <label>
                          <span>Open</span>
                          <input
                            type="time"
                            required
                            value={item.openingTime}
                            onChange={(event) =>
                              updateSchedule(index, {
                                openingTime: event.target.value,
                              })
                            }
                          />
                        </label>
                        <span className="time-separator">to</span>
                        <label>
                          <span>Close</span>
                          <input
                            type="time"
                            required
                            value={item.closingTime}
                            onChange={(event) =>
                              updateSchedule(index, {
                                closingTime: event.target.value,
                              })
                            }
                          />
                        </label>
                      </div>
                    ) : (
                      <strong className="closed-label">Closed</strong>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="setup-actions">
              {ownedRestaurants.length > 0 && (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setSetupStep(0)}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="primary-button"
              >
                Continue to tables
              </button>
            </div>
          </form>
        ) : (
          <form className="setup-card card" onSubmit={finishTableSetup}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">Step 2 of 2</span>
                <h2>Tables & seating</h2>
              </div>
              <FiUsers />
            </div>

            <p className="section-copy">
              Add each physical table and the maximum number of guests it can seat.
            </p>

            <div className="setup-table-list">
              {setupTables.map((table, index) => (
                <div className="setup-table-row" key={index}>
                  <label className="field">
                    <span>Table number</span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={table.tableNumber}
                      onChange={(event) =>
                        updateSetupTable(index, {
                          tableNumber: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="field">
                    <span>Seats</span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={table.capacity}
                      onChange={(event) =>
                        updateSetupTable(index, {
                          capacity: event.target.value,
                        })
                      }
                    />
                  </label>

                  <button
                    type="button"
                    className="icon-button danger-icon"
                    disabled={setupTables.length === 1}
                    onClick={() => removeSetupTableRow(index)}
                    aria-label={"Remove table " + table.tableNumber}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="secondary-button add-table-row"
              onClick={addSetupTableRow}
            >
              <FiPlus />
              Add another table
            </button>

            <div className="setup-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={savingTables}
              >
                <FiCheckCircle />
                {savingTables ? "Saving tables..." : "Finish restaurant setup"}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  if (!adminRestaurant) {
    return (
      <div className="partner-dashboard">
        <section className="partner-dashboard-header">
          <div>
            <span className="eyebrow">Partner portal</span>
            <h1>My restaurants</h1>
            <p>Select a restaurant to manage or add another location.</p>
          </div>

          <button type="button" className="primary-button" onClick={beginSetup}>
            <FiPlus />
            Add restaurant
          </button>
        </section>

        {ownedRestaurantsLoading ? (
          <section className="state-panel compact-state">
            <div className="spinner" />
            <p>Loading your restaurants...</p>
          </section>
        ) : (
          <section className="owner-restaurant-grid">
            {ownedRestaurants.map((restaurant) => {
              const id = restaurant.id ?? restaurant.Id;
              const operatingHours =
                restaurant.operatingHours ?? restaurant.OperatingHours ?? [];

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
                    {operatingHours.length} operating days configured
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

  const adminHours =
    adminRestaurant.operatingHours ?? adminRestaurant.OperatingHours ?? [];

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
            <span>{adminHours.length} operating days</span>
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

      <section className="operating-hours-card card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Weekly schedule</span>
            <h2>Operating hours</h2>
          </div>
        </div>

        <div className="hours-summary-grid">
          {DAYS.map((day) => {
            const hours = adminHours.find(
              (item) => (item.dayOfWeek ?? item.DayOfWeek) === day,
            );

            return (
              <div className="hours-summary-row" key={day}>
                <strong>{day.slice(0, 3)}</strong>
                <span>
                  {hours
                    ? formatClock(
                        (hours.openingTime ?? hours.OpeningTime).slice(0, 5),
                      ) +
                      " – " +
                      formatClock(
                        (hours.closingTime ?? hours.ClosingTime).slice(0, 5),
                      )
                    : "Closed"}
                </span>
              </div>
            );
          })}
        </div>
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
              <span>Seats</span>
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
                const status = reservation.status ?? reservation.Status;
                const date = new Date(
                  reservation.timeSlot ?? reservation.TimeSlot,
                );

                const table = adminTables.find(
                  (item) =>
                    String(item.id ?? item.Id) ===
                    String(reservation.tableId ?? reservation.TableId),
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
                        Table {table?.tableNumber ?? table?.TableNumber ?? "—"} ·{" "}
                        {reservation.partySize ?? reservation.PartySize} guests
                      </span>
                      <small>
                        Customer{" "}
                        {String(
                          reservation.customerId ?? reservation.CustomerId,
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

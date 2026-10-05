namespace MicroBooker.Domain;

public interface IReservationRepository
{
    Task<bool> TryCreateAsync(
        Reservation reservation,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Reservation>> GetByRestaurantIdAsync(
        Guid restaurantId,
        CancellationToken cancellationToken = default);

    Task<Reservation?> UpdateStatusAsync(
        Guid restaurantId,
        Guid reservationId,
        ReservationStatus status,
        CancellationToken cancellationToken = default);
}

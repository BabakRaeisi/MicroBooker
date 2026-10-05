namespace MicroBooker.Domain;

public interface IReservationRepository
{
    Task<bool> TryCreateAsync(
        Reservation reservation,
        CancellationToken cancellationToken = default);
     Task<IReadOnlyList<Reservation>> GetByRestaurantIdAsync(
        Guid restaurantId,
        CancellationToken cancellationToken = default);


        Task<IReadOnlyList<Reservation>> GetAllAsync(
    CancellationToken cancellationToken = default);
}
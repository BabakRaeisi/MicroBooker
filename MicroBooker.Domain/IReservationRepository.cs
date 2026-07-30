namespace MicroBooker.Domain;

public interface IReservationRepository
{
    Task<bool> TryCreateAsync(
        Reservation reservation,
        CancellationToken cancellationToken = default);
}
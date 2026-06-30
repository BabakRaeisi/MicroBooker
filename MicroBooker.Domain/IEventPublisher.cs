using MicroBooker.Domain;

namespace MicroBooker.Domain;

public interface IEventPublisher
{
    Task PublishReservationCreatedAsync(Reservation reservation, CancellationToken ct = default);
}
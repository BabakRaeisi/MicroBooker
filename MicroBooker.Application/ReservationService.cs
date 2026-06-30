using MicroBooker.Domain;

namespace MicroBooker.Application; 


public class ReservationService
{
    private readonly ILockService _lockService;
    private readonly IEventPublisher _eventPublisher;

    public ReservationService(ILockService lockService, IEventPublisher eventPublisher)
    {
        _lockService = lockService;
        _eventPublisher = eventPublisher;
    }

    public async Task<Reservation?> BookTableAsync(
        ReservationRequestDto request,
        CancellationToken ct = default)
    {
        bool isLocked = await _lockService.AcquireLockAsync(
            request.TableId,
            request.TimeSlot,
            TimeSpan.FromSeconds(30));

        if (!isLocked) return null;

        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            CustomerId = request.CustomerId,
            RestaurantId = request.RestaurantId,
            TableId = request.TableId,
            TimeSlot = request.TimeSlot,
            PartySize = request.PartySize,
            CreatedAt = DateTime.UtcNow
        };

        await _eventPublisher.PublishReservationCreatedAsync(reservation, ct);

        return reservation;
    }
}
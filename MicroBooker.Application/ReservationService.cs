using MicroBooker.Domain;
using Microsoft.Extensions.Logging;

namespace MicroBooker.Application;

public class ReservationService
{
    private readonly ILockService _lockService;
    private readonly IEventPublisher _eventPublisher;
    private readonly ILogger<ReservationService> _logger;

    public ReservationService(ILockService lockService, IEventPublisher eventPublisher, ILogger<ReservationService> logger)
    {
        _lockService = lockService;
        _eventPublisher = eventPublisher;
        _logger = logger;
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

        // Fire-and-forget — Kafka unavailability must not fail the booking
        _ = Task.Run(async () =>
        {
            try
            {
                await _eventPublisher.PublishReservationCreatedAsync(reservation, CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish reservation event for {ReservationId}", reservation.Id);
            }
        });

        return reservation;
    }
}
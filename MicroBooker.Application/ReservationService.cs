using MicroBooker.Domain;
using Microsoft.Extensions.Logging;

namespace MicroBooker.Application;

public class ReservationService
{
    private readonly ILockService _lockService;
    private readonly IEventPublisher _eventPublisher;
    private readonly IReservationRepository _reservationRepository;
    private readonly ILogger<ReservationService> _logger;

    public ReservationService(
        ILockService lockService,
        IEventPublisher eventPublisher,
        IReservationRepository reservationRepository,
        ILogger<ReservationService> logger)
    {
        _lockService = lockService;
        _eventPublisher = eventPublisher;
        _reservationRepository = reservationRepository;
        _logger = logger;
    }

    public async Task<Reservation?> BookTableAsync(
        ReservationRequestDto request,
        CancellationToken ct = default)
    {
        var isLocked = await _lockService.AcquireLockAsync(
            request.TableId,
            request.TimeSlot,
            TimeSpan.FromSeconds(30));

        if (!isLocked)
            return null;

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

        var created = await _reservationRepository.TryCreateAsync(
            reservation,
            ct);

        if (!created)
        {
            _logger.LogWarning(
                "Duplicate booking rejected for {RestaurantId}, {TableId}, {TimeSlot}",
                request.RestaurantId,
                request.TableId,
                request.TimeSlot);

            return null;
        }

        try
        {
            await _eventPublisher.PublishReservationCreatedAsync(
                reservation,
                ct);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Booking {ReservationId} was saved, but its event was not published",
                reservation.Id);
        }

        return reservation;
    }
}
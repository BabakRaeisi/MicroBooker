using Microsoft.Extensions.Logging;
using MicroBooker.Domain;

namespace MicroBooker.Application;

public class ReservationService
{
    private readonly ILockService _lockService;
    private readonly IEventPublisher _eventPublisher;
    private readonly IReservationRepository _reservationRepository;
    private readonly IRestaurantTableRepository _tableRepository;
    private readonly IRestaurantRepository _restaurantRepository;
    private readonly ILogger<ReservationService> _logger;

    public ReservationService(
        ILockService lockService,
        IEventPublisher eventPublisher,
        IReservationRepository reservationRepository,
        IRestaurantTableRepository tableRepository,
        IRestaurantRepository restaurantRepository,
        ILogger<ReservationService> logger)
    {
        _lockService = lockService;
        _eventPublisher = eventPublisher;
        _reservationRepository = reservationRepository;
        _tableRepository = tableRepository;
        _restaurantRepository = restaurantRepository;
        _logger = logger;
    }

    public async Task<IReadOnlyList<Reservation>> GetByRestaurantIdAsync(
        Guid restaurantId,
        CancellationToken cancellationToken = default)
    {
        return await _reservationRepository.GetByRestaurantIdAsync(
            restaurantId,
            cancellationToken);
    }

    public async Task<BookingResult> BookTableAsync(
        ReservationRequestDto request,
        string customerId,
        CancellationToken ct = default)
    {
        var table = await _tableRepository.GetByIdAsync(
            request.TableId,
            ct);

        if (table is null)
        {
            return BookingResult.Failure(
                BookingFailureReason.TableNotFound);
        }

        if (table.RestaurantId != request.RestaurantId)
        {
            return BookingResult.Failure(
                BookingFailureReason.TableDoesNotBelongToRestaurant);
        }

        if (!table.IsActive)
        {
            return BookingResult.Failure(
                BookingFailureReason.TableInactive);
        }

        if (request.PartySize > table.Capacity)
        {
            return BookingResult.Failure(
                BookingFailureReason.PartyTooLarge);
        }

        if (request.TimeSlot <= DateTimeOffset.UtcNow)
        {
            return BookingResult.Failure(
                BookingFailureReason.TimeSlotInPast);
        }

        var restaurant = await _restaurantRepository.GetByIdAsync(
            request.RestaurantId,
            ct);

        if (restaurant is null)
        {
            return BookingResult.Failure(
                BookingFailureReason.RestaurantNotFound);
        }

        var requestedLocalTime = TimeOnly.FromDateTime(request.TimeSlot.DateTime);

        if (!IsWithinOpeningHours(
                requestedLocalTime,
                restaurant.OpeningTime,
                restaurant.ClosingTime))
        {
            return BookingResult.Failure(
                BookingFailureReason.RestaurantClosed);
        }

        var isLocked = await _lockService.AcquireLockAsync(
            request.TableId,
            request.TimeSlot,
            TimeSpan.FromSeconds(30));

        if (!isLocked)
        {
            return BookingResult.Failure(
                BookingFailureReason.SlotLocked);
        }

        var normalizedTimeSlot =
            request.TimeSlot.ToUniversalTime().ToString("O");

        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            RestaurantId = request.RestaurantId,
            TableId = request.TableId,
            TimeSlot = normalizedTimeSlot,
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
                normalizedTimeSlot);

            return BookingResult.Failure(
                BookingFailureReason.AlreadyBooked);
        }

        // TODO: Improve reliability with the transactional outbox pattern.
        // The reservation is currently saved before the Kafka event is published.
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

        return BookingResult.Success(reservation);
    }

    private static bool IsWithinOpeningHours(
        TimeOnly time,
        TimeOnly openingTime,
        TimeOnly closingTime)
    {
        if (openingTime == closingTime)
            return false;

        if (openingTime < closingTime)
        {
            return time >= openingTime &&
                   time < closingTime;
        }

        // Overnight schedule, for example 18:00-02:00.
        return time >= openingTime ||
               time < closingTime;
    }
}

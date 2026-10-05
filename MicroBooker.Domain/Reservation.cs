namespace MicroBooker.Domain;

public class Reservation
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string CustomerId { get; set; } = string.Empty;

    public Guid RestaurantId { get; set; }

    public Guid TableId { get; set; }

    public string TimeSlot { get; set; } = string.Empty;

    public int PartySize { get; set; }

    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

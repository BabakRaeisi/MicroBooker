namespace MicroBooker.Domain;

public class Reservation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string CustomerId { get; set; } = string.Empty;
    public string RestaurantId { get; set; } = string.Empty;
    public string TableId { get; set; } = string.Empty;
    public string TimeSlot { get; set; } = string.Empty; // e.g., "2026-06-15T19:00:00"
    public int PartySize { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
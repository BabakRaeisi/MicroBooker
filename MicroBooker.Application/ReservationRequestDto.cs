public class ReservationRequestDto
{
    public string CustomerId { get; set; } = string.Empty;

    public Guid RestaurantId { get; set; }

    public Guid TableId { get; set; }

    public string TimeSlot { get; set; } = string.Empty;

    public int PartySize { get; set; }
}
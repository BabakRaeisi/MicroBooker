using System.ComponentModel.DataAnnotations;

namespace MicroBooker.Application;

public class ReservationRequestDto
{
    public Guid RestaurantId { get; set; }

    public Guid TableId { get; set; }

    public DateTimeOffset TimeSlot { get; set; }

    [Range(1, int.MaxValue)]
    public int PartySize { get; set; }
}

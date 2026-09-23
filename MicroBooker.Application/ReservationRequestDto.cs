using System.ComponentModel.DataAnnotations;

namespace MicroBooker.Application;

public class ReservationRequestDto
{
    public string CustomerId { get; set; } = string.Empty;

    [Required]
    public string RestaurantId { get; set; } = string.Empty;

    [Required]
    public string TableId { get; set; } = string.Empty;

    [Required]
    public string TimeSlot { get; set; } = string.Empty;

    [Range(1, 20)]
    public int PartySize { get; set; }
}
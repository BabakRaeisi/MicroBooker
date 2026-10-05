using MicroBooker.Domain;

namespace MicroBooker.Application;

public class UpdateReservationStatusRequestDto
{
    public ReservationStatus Status { get; set; }
}

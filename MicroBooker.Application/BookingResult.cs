namespace MicroBooker.Application;

using MicroBooker.Domain;

public class BookingResult
{
    public Reservation? Reservation { get; init; }

    public BookingFailureReason FailureReason { get; init; }

    public bool IsSuccess => Reservation is not null;

    public static BookingResult Success(Reservation reservation)
    {
        return new BookingResult
        {
            Reservation = reservation,
            FailureReason = BookingFailureReason.None
        };
    }

    public static BookingResult Failure(BookingFailureReason reason)
    {
        return new BookingResult
        {
            FailureReason = reason
        };
    }
}
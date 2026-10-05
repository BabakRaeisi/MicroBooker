namespace MicroBooker.Domain;

public class RestaurantOperatingHours
{
    public DayOfWeek DayOfWeek { get; set; }

    public TimeOnly OpeningTime { get; set; }

    public TimeOnly ClosingTime { get; set; }
}

namespace MicroBooker.Domain;

public class RestaurantTable
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid RestaurantId { get; set; }

    public int TableNumber { get; set; }

    public int Capacity { get; set; }

    public bool IsActive { get; set; } = true;
}
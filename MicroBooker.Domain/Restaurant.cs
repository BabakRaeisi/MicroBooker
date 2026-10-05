namespace MicroBooker.Domain;

public class Restaurant
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string OwnerUserId { get; set; } = string.Empty;

    public List<RestaurantOperatingHours> OperatingHours { get; set; } = [];
}

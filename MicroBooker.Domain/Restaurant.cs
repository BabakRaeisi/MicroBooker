namespace MicroBooker.Domain;

public class Restaurant
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public TimeOnly OpeningTime { get; set; }
    public string OwnerUserId { get; set; } = string.Empty;

    public TimeOnly ClosingTime { get; set; }
}
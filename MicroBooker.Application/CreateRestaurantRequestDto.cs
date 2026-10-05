using System.ComponentModel.DataAnnotations;

namespace MicroBooker.Application;

public class CreateRestaurantRequestDto : IValidatableObject
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Address { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Phone { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    public List<CreateRestaurantOperatingHoursDto> OperatingHours { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (OperatingHours
            .GroupBy(item => item.DayOfWeek)
            .Any(group => group.Count() > 1))
        {
            yield return new ValidationResult(
                "Each operating day can only be configured once.",
                new[] { nameof(OperatingHours) });
        }

        foreach (var hours in OperatingHours)
        {
            if (hours.ClosingTime <= hours.OpeningTime)
            {
                yield return new ValidationResult(
                    $"{hours.DayOfWeek}: closing time must be later than opening time.",
                    new[] { nameof(OperatingHours) });
            }
        }
    }
}

public class CreateRestaurantOperatingHoursDto
{
    public DayOfWeek DayOfWeek { get; set; }

    public TimeOnly OpeningTime { get; set; }

    public TimeOnly ClosingTime { get; set; }
}

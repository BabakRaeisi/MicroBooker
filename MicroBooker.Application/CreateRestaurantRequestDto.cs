using System.ComponentModel.DataAnnotations;

namespace MicroBooker.Application;

public class CreateRestaurantRequestDto : IValidatableObject
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [RegularExpression(
        @"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        ErrorMessage = "Slug can only contain lowercase letters, numbers, and hyphens.")]
    public string Slug { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Address { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Phone { get; set; } = string.Empty;

    public TimeOnly OpeningTime { get; set; }

    public TimeOnly ClosingTime { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (OpeningTime == ClosingTime)
        {
            yield return new ValidationResult(
                "Opening and closing times cannot be the same.",
                new[] { nameof(OpeningTime), nameof(ClosingTime) });
        }
    }
}

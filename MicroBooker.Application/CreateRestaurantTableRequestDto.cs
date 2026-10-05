using System.ComponentModel.DataAnnotations;

namespace MicroBooker.Application;

public class CreateRestaurantTableRequestDto
{
    [Range(1, int.MaxValue)]
    public int TableNumber { get; set; }

    [Range(1, int.MaxValue)]
    public int Capacity { get; set; }
}
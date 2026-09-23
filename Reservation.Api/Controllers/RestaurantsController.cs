using Microsoft.AspNetCore.Mvc;
using MicroBooker.Application;

namespace Reservation.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RestaurantsController : ControllerBase
{
    private readonly RestaurantService _restaurantService;

    public RestaurantsController(RestaurantService restaurantService)
    {
        _restaurantService = restaurantService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateRestaurant(
        [FromBody] CreateRestaurantRequestDto request,
        CancellationToken cancellationToken)
    {
        var restaurant = await _restaurantService.CreateAsync(
            request,
            cancellationToken);

        return Ok(restaurant);
    }
}
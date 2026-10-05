using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MicroBooker.Application;
using Reservation.Api.Extensions;

namespace Reservation.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin/restaurants")]
public class AdminRestaurantsController : ControllerBase
{
    private readonly RestaurantService _restaurantService;

    public AdminRestaurantsController(RestaurantService restaurantService)
    {
        _restaurantService = restaurantService;
    }

    [HttpGet]
    public async Task<IActionResult> GetOwnedRestaurants(
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();

        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var restaurants = await _restaurantService.GetOwnedByUserIdAsync(
            userId,
            cancellationToken);

        return Ok(restaurants.Select(restaurant => new
        {
            restaurant.Id,
            restaurant.Name,
            restaurant.Slug,
            restaurant.Address,
            restaurant.Phone,
            restaurant.OpeningTime,
            restaurant.ClosingTime
        }));
    }
}

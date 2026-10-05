using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MicroBooker.Application;
using Reservation.Api.Extensions;

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

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateRestaurant(
        [FromBody] CreateRestaurantRequestDto request,
        CancellationToken cancellationToken)
    {
        var ownerUserId = User.GetUserId();

        if (string.IsNullOrWhiteSpace(ownerUserId))
        {
            return Unauthorized(new
            {
                message = "Missing user id claim in token."
            });
        }

        var restaurant = await _restaurantService.CreateAsync(
            request,
            ownerUserId,
            cancellationToken);

        if (restaurant is null)
        {
            return Conflict(new
            {
                message = "A restaurant with this slug already exists."
            });
        }

        return Ok(restaurant);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetRestaurantById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var restaurant = await _restaurantService.GetByIdAsync(
            id,
            cancellationToken);

        if (restaurant is null)
            return NotFound();

        return Ok(new
        {
            restaurant.Id,
            restaurant.Name,
            restaurant.Slug,
            restaurant.Address,
            restaurant.Phone,
            restaurant.OpeningTime,
            restaurant.ClosingTime
        });
    }
}

using Microsoft.AspNetCore.Mvc;
using MicroBooker.Application;
using System.Security.Claims ; 
using Microsoft.AspNetCore.Authorization; 

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
    var ownerUserId =
        User.FindFirstValue(ClaimTypes.NameIdentifier) ??
        User.FindFirstValue("sub") ??
        User.FindFirstValue("nameid");

    if (string.IsNullOrWhiteSpace(ownerUserId))
        return Unauthorized(new { message = "Missing user id claim in token." });

    var restaurant = await _restaurantService.CreateAsync(
        request,
        ownerUserId,
        cancellationToken);

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

    return Ok(restaurant);
}
}
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
    private readonly RestaurantTableService _tableService;
    private readonly ReservationService _reservationService;

    public RestaurantsController(
        RestaurantService restaurantService,
        RestaurantTableService tableService,
        ReservationService reservationService)
    {
        _restaurantService = restaurantService;
        _tableService = tableService;
        _reservationService = reservationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetRestaurants(
        CancellationToken cancellationToken)
    {
        var restaurants = await _restaurantService.GetAllAsync(cancellationToken);

        return Ok(restaurants.Select(restaurant => new
        {
            restaurant.Id,
            restaurant.Name,
            restaurant.Slug,
            restaurant.Address,
            restaurant.Phone,
            restaurant.OperatingHours
        }));
    }

    [Authorize(Roles = "Partner")]
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
            restaurant.OperatingHours
        });
    }

    [HttpGet("{id:guid}/tables")]
    public async Task<IActionResult> GetPublicTables(
        Guid id,
        CancellationToken cancellationToken)
    {
        var restaurant = await _restaurantService.GetByIdAsync(
            id,
            cancellationToken);

        if (restaurant is null)
            return NotFound();

        var tables = await _tableService.GetByRestaurantIdAsync(
            id,
            cancellationToken);

        return Ok(
            tables
                .Where(table => table.IsActive)
                .Select(table => new
                {
                    table.Id,
                    table.RestaurantId,
                    table.TableNumber,
                    table.Capacity
                }));
    }

    [HttpGet("{id:guid}/availability")]
    public async Task<IActionResult> GetAvailability(
        Guid id,
        CancellationToken cancellationToken)
    {
        var restaurant = await _restaurantService.GetByIdAsync(
            id,
            cancellationToken);

        if (restaurant is null)
            return NotFound();

        var reservations = await _reservationService.GetByRestaurantIdAsync(
            id,
            cancellationToken);

        return Ok(
            reservations.Select(reservation => new
            {
                reservation.TableId,
                reservation.TimeSlot,
                reservation.Status
            }));
    }
}

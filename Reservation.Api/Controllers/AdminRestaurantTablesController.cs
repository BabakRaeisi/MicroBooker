using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MicroBooker.Application;

namespace Reservation.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin/restaurants/{restaurantId:guid}/tables")]
public class AdminRestaurantTablesController : ControllerBase
{
    private readonly RestaurantService _restaurantService;
    private readonly RestaurantTableService _tableService;

    public AdminRestaurantTablesController(
        RestaurantService restaurantService,
        RestaurantTableService tableService)
    {
        _restaurantService = restaurantService;
        _tableService = tableService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateTable(
        Guid restaurantId,
        [FromBody] CreateRestaurantTableRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub") ??
            User.FindFirstValue("nameid");

        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var restaurant = await _restaurantService.GetByIdAsync(
            restaurantId,
            cancellationToken);

        if (restaurant is null)
            return NotFound();

        if (restaurant.OwnerUserId != userId)
            return Forbid();

        var table = await _tableService.CreateAsync(
            restaurantId,
            request,
            cancellationToken);

        return Ok(table);
    }

    [HttpGet]
    public async Task<IActionResult> GetTables(
        Guid restaurantId,
        CancellationToken cancellationToken)
    {
        var userId =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub") ??
            User.FindFirstValue("nameid");

        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var restaurant = await _restaurantService.GetByIdAsync(
            restaurantId,
            cancellationToken);

        if (restaurant is null)
            return NotFound();

        if (restaurant.OwnerUserId != userId)
            return Forbid();

        var tables = await _tableService.GetByRestaurantIdAsync(
            restaurantId,
            cancellationToken);

        return Ok(tables);
    }
}
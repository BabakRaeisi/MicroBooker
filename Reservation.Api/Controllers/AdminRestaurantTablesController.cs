using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MicroBooker.Application;
using Reservation.Api.Extensions;

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
        var userId = User.GetUserId();

        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        if (!await _restaurantService.IsOwnerAsync(
                restaurantId,
                userId,
                cancellationToken))
        {
            return Forbid();
        }

        var table = await _tableService.CreateAsync(
            restaurantId,
            request,
            cancellationToken);

        if (table is null)
        {
            return Conflict(new
            {
                message = "A table with this number already exists for this restaurant."
            });
        }

        return Ok(table);
    }

    [HttpGet]
    public async Task<IActionResult> GetTables(
        Guid restaurantId,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();

        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        if (!await _restaurantService.IsOwnerAsync(
                restaurantId,
                userId,
                cancellationToken))
        {
            return Forbid();
        }

        var tables = await _tableService.GetByRestaurantIdAsync(
            restaurantId,
            cancellationToken);

        return Ok(tables);
    }
}

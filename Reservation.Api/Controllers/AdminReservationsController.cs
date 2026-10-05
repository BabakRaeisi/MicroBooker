using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MicroBooker.Application;
using Reservation.Api.Extensions;

namespace Reservation.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin/restaurants/{restaurantId:guid}/reservations")]
public class AdminReservationsController : ControllerBase
{
    private readonly ReservationService _reservationService;
    private readonly RestaurantService _restaurantService;

    public AdminReservationsController(
        ReservationService reservationService,
        RestaurantService restaurantService)
    {
        _reservationService = reservationService;
        _restaurantService = restaurantService;
    }

    [HttpGet]
    public async Task<IActionResult> GetReservations(
        Guid restaurantId,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();

        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var isOwner = await _restaurantService.IsOwnerAsync(
            restaurantId,
            userId,
            cancellationToken);

        if (!isOwner)
            return Forbid();

        var reservations =
            await _reservationService.GetByRestaurantIdAsync(
                restaurantId,
                cancellationToken);

        return Ok(reservations);
    }
}
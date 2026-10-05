using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MicroBooker.Application;
using Reservation.Api.Extensions;

namespace Reservation.Api.Controllers;

[ApiController]
[Authorize(Roles = "Partner")]
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

    [HttpPatch("{reservationId:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid restaurantId,
        Guid reservationId,
        [FromBody] UpdateReservationStatusRequestDto request,
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

        var reservation = await _reservationService.UpdateStatusAsync(
            restaurantId,
            reservationId,
            request.Status,
            cancellationToken);

        if (reservation is null)
        {
            return NotFound(new
            {
                message = "Reservation not found for this restaurant."
            });
        }

        return Ok(reservation);
    }
}

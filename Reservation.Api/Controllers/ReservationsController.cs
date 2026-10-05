using Microsoft.AspNetCore.Mvc;
using MicroBooker.Application;
 
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace Reservation.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly ReservationService _reservationService;
   

    public ReservationsController(ReservationService reservationService )
    {
        _reservationService = reservationService;
     
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetReservations()
    {
  var reservations = await _reservationService.GetAllAsync(
    HttpContext.RequestAborted);

return Ok(reservations);
    }

[Authorize]
[HttpPost]
public async Task<IActionResult> PostReservation(
    [FromBody] ReservationRequestDto request)
    {
        var customerId =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub") ??
            User.FindFirstValue("nameid") ??
            User.FindFirstValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");

        if (string.IsNullOrWhiteSpace(customerId))
            return Unauthorized(new { message = "Missing user id claim in token." });

        request.CustomerId = customerId; // enforce from JWT, ignore client-sent value

    var result = await _reservationService.BookTableAsync(
    request,
    HttpContext.RequestAborted);

if (result.IsSuccess)
    return Accepted(result.Reservation);

return result.FailureReason switch
{
    BookingFailureReason.TableNotFound =>
        NotFound(new { message = "Table not found." }),

    BookingFailureReason.TableDoesNotBelongToRestaurant =>
        BadRequest(new { message = "Table does not belong to this restaurant." }),

    BookingFailureReason.TableInactive =>
        Conflict(new { message = "Table is inactive." }),

    BookingFailureReason.PartyTooLarge =>
        BadRequest(new { message = "Party size exceeds table capacity." }),

    BookingFailureReason.SlotLocked =>
        Conflict(new { message = "This table is currently being booked." }),

    BookingFailureReason.AlreadyBooked =>
        Conflict(new { message = "This table is already booked for that time slot." }),

    _ =>
        StatusCode(500, new { message = "Unknown booking error." })
};
    }
}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MicroBooker.Application;
using Reservation.Api.Extensions;

namespace Reservation.Api.Controllers;

[ApiController]
[Authorize(Roles = "Customer")]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly ReservationService _reservationService;

    public ReservationsController(
        ReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    [HttpPost]
    public async Task<IActionResult> PostReservation(
        [FromBody] ReservationRequestDto request)
    {
        var customerId = User.GetUserId();

        if (string.IsNullOrWhiteSpace(customerId))
        {
            return Unauthorized(new
            {
                message = "Missing user id claim in token."
            });
        }

        var result = await _reservationService.BookTableAsync(
            request,
            customerId,
            HttpContext.RequestAborted);

        if (result.IsSuccess)
            return Accepted(result.Reservation);

        return result.FailureReason switch
        {
            BookingFailureReason.RestaurantNotFound =>
                NotFound(new { message = "Restaurant not found." }),

            BookingFailureReason.TableNotFound =>
                NotFound(new { message = "Table not found." }),

            BookingFailureReason.TableDoesNotBelongToRestaurant =>
                BadRequest(new { message = "Table does not belong to this restaurant." }),

            BookingFailureReason.TableInactive =>
                Conflict(new { message = "Table is inactive." }),

            BookingFailureReason.PartyTooLarge =>
                BadRequest(new { message = "Party size exceeds table capacity." }),

            BookingFailureReason.TimeSlotInPast =>
                BadRequest(new { message = "Reservation time must be in the future." }),

            BookingFailureReason.RestaurantClosed =>
                BadRequest(new { message = "Restaurant is closed at the requested time." }),

            BookingFailureReason.SlotLocked =>
                Conflict(new { message = "This table is currently being booked." }),

            BookingFailureReason.AlreadyBooked =>
                Conflict(new { message = "This table is already booked for that time slot." }),

            _ =>
                StatusCode(500, new { message = "Unknown booking error." })
        };
    }
}

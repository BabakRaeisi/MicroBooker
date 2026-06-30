using Microsoft.AspNetCore.Mvc;
using MicroBooker.Application;
 
using MongoDB.Driver;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace Reservation.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly ReservationService _reservationService;
    private readonly IMongoCollection<MicroBooker.Domain.Reservation> _reservations;

    public ReservationsController(ReservationService reservationService, IMongoDatabase database)
    {
        _reservationService = reservationService;
        _reservations = database.GetCollection<MicroBooker.Domain.Reservation>("reservations");
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetReservations()
    {
        var docs = await _reservations
            .Find(Builders<MicroBooker.Domain.Reservation>.Filter.Empty)
            .SortByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(docs);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> PostReservation(
        [FromBody] ReservationRequestDto request,
        [FromServices] ReservationService reservationService)
    {
        var customerId =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub") ??
            User.FindFirstValue("nameid") ??
            User.FindFirstValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");

        if (string.IsNullOrWhiteSpace(customerId))
            return Unauthorized(new { message = "Missing user id claim in token." });

        request.CustomerId = customerId; // enforce from JWT, ignore client-sent value

        var result = await reservationService.BookTableAsync(request, HttpContext.RequestAborted);

        if (result is null)
            return Conflict(new { message = "Slot is locked or already booked." });

        return Accepted(result);
    }
}
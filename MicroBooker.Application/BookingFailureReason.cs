namespace MicroBooker.Application;

public enum BookingFailureReason
{
    None,
    TableNotFound,
    TableDoesNotBelongToRestaurant,
    TableInactive,
    PartyTooLarge,
    SlotLocked,
    AlreadyBooked
}
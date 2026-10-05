namespace MicroBooker.Application;

public enum BookingFailureReason
{
    None,
    RestaurantNotFound,
    TableNotFound,
    TableDoesNotBelongToRestaurant,
    TableInactive,
    PartyTooLarge,
    TimeSlotInPast,
    RestaurantClosed,
    SlotLocked,
    AlreadyBooked
}

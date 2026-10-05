namespace MicroBooker.Domain;

public interface IRestaurantTableRepository
{
    Task<bool> TryCreateAsync(
        RestaurantTable table,
        CancellationToken cancellationToken = default);

    Task<RestaurantTable?> GetByIdAsync(
        Guid tableId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RestaurantTable>> GetByRestaurantIdAsync(
        Guid restaurantId,
        CancellationToken cancellationToken = default);
}

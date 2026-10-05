namespace MicroBooker.Domain;

public interface IRestaurantRepository
{
    Task<bool> TryCreateAsync(
        Restaurant restaurant,
        CancellationToken cancellationToken = default);

    Task<Restaurant?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<Restaurant?> GetBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default);
}

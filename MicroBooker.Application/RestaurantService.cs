using MicroBooker.Domain;

namespace MicroBooker.Application;

public class RestaurantService
{
    private readonly IRestaurantRepository _restaurantRepository;

    public RestaurantService(IRestaurantRepository restaurantRepository)
    {
        _restaurantRepository = restaurantRepository;
    }

    public async Task<Restaurant?> CreateAsync(
        CreateRestaurantRequestDto request,
        string ownerUserId,
        CancellationToken cancellationToken = default)
    {
        var restaurant = new Restaurant
        {
            Id = Guid.NewGuid(),
            OwnerUserId = ownerUserId,
            Name = request.Name.Trim(),
            Slug = request.Slug.Trim().ToLowerInvariant(),
            Address = request.Address.Trim(),
            Phone = request.Phone.Trim(),
            OpeningTime = request.OpeningTime,
            ClosingTime = request.ClosingTime
        };

        var created = await _restaurantRepository.TryCreateAsync(
            restaurant,
            cancellationToken);

        return created ? restaurant : null;
    }

    public async Task<Restaurant?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _restaurantRepository.GetByIdAsync(
            id,
            cancellationToken);
    }

    public async Task<IReadOnlyList<Restaurant>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await _restaurantRepository.GetAllAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Restaurant>> GetOwnedByUserIdAsync(
        string ownerUserId,
        CancellationToken cancellationToken = default)
    {
        return await _restaurantRepository.GetByOwnerUserIdAsync(
            ownerUserId,
            cancellationToken);
    }

    public async Task<bool> IsOwnerAsync(
        Guid restaurantId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        var restaurant = await _restaurantRepository.GetByIdAsync(
            restaurantId,
            cancellationToken);

        return restaurant is not null &&
               restaurant.OwnerUserId == userId;
    }
}

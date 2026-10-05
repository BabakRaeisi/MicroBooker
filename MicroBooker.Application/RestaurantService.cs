using MicroBooker.Domain;

namespace MicroBooker.Application;

public class RestaurantService
{
    private readonly IRestaurantRepository _restaurantRepository;

    public RestaurantService(IRestaurantRepository restaurantRepository)
    {
        _restaurantRepository = restaurantRepository;
    }

public async Task<Restaurant> CreateAsync(
    CreateRestaurantRequestDto request,
    string ownerUserId,
    CancellationToken cancellationToken = default)
    {
        var restaurant = new Restaurant
    {
        Id = Guid.NewGuid(),
        OwnerUserId = ownerUserId,
        Name = request.Name.Trim(),
        Slug = request.Slug.Trim(),
        Address = request.Address.Trim(),
        Phone = request.Phone.Trim(),
        OpeningTime = request.OpeningTime,
        ClosingTime = request.ClosingTime
    };

        await _restaurantRepository.CreateAsync(
            restaurant,
            cancellationToken);

        return restaurant;
    }
    public async Task<Restaurant?> GetByIdAsync(
    Guid id,
    CancellationToken cancellationToken = default)
{
    return await _restaurantRepository.GetByIdAsync(
        id,
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
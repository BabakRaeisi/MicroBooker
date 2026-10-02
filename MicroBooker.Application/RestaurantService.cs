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
        CancellationToken cancellationToken = default)
    {
        var restaurant = new Restaurant
        {
            Id = Guid.NewGuid(),
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
}
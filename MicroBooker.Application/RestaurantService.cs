using System.Text.RegularExpressions;
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
        var id = Guid.NewGuid();
        var baseSlug = Regex
            .Replace(request.Name.Trim().ToLowerInvariant(), @"[^a-z0-9]+", "-")
            .Trim('-');

        if (string.IsNullOrWhiteSpace(baseSlug))
            baseSlug = "restaurant";

        var restaurant = new Restaurant
        {
            Id = id,
            OwnerUserId = ownerUserId,
            Name = request.Name.Trim(),
            Slug = $"{baseSlug}-{id.ToString("N")[..6]}",
            Address = request.Address.Trim(),
            Phone = request.Phone.Trim(),
            OperatingHours = request.OperatingHours
                .OrderBy(item => item.DayOfWeek)
                .Select(item => new RestaurantOperatingHours
                {
                    DayOfWeek = item.DayOfWeek,
                    OpeningTime = item.OpeningTime,
                    ClosingTime = item.ClosingTime
                })
                .ToList()
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

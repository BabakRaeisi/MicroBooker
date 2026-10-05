using MicroBooker.Domain;

namespace MicroBooker.Application;

public class RestaurantTableService
{
    private readonly IRestaurantTableRepository _tableRepository;

    public RestaurantTableService(IRestaurantTableRepository tableRepository)
    {
        _tableRepository = tableRepository;
    }

    public async Task<RestaurantTable?> CreateAsync(
        Guid restaurantId,
        CreateRestaurantTableRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var table = new RestaurantTable
        {
            Id = Guid.NewGuid(),
            RestaurantId = restaurantId,
            TableNumber = request.TableNumber,
            Capacity = request.Capacity,
            IsActive = true
        };

        var created = await _tableRepository.TryCreateAsync(
            table,
            cancellationToken);

        return created ? table : null;
    }

    public async Task<IReadOnlyList<RestaurantTable>> GetByRestaurantIdAsync(
        Guid restaurantId,
        CancellationToken cancellationToken = default)
    {
        return await _tableRepository.GetByRestaurantIdAsync(
            restaurantId,
            cancellationToken);
    }
}

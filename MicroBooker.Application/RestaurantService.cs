using MicroBooker.Domain; 
namespace MicroBooker.Application ; 

public class RestaurantService
{
    public readonly IRestaurantRepository _restaurantRepository ; 
    public RestaurantService(IRestaurantRepository restaurantRepository)
    {
        _restaurantRepository = restaurantRepository; 
    }

    public async Task CreatedAtAsync(
        CreateRestaurantRequestDto createRestaurantRequestDto,
         CancellationToken cancellationToken = default)
    {
       //
    }

}
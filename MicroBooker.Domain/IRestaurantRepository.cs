namespace MicroBooker.Domain;
public interface IRestaurantRepository
{
    Task CreateAsync(Restaurant restaurant,CancellationToken ct = default );

    Task<Restaurant?>GetByIdAsync(Guid guid , CancellationToken ct = default); 

    Task<Restaurant?>GetBySlugAsync(string slug,CancellationToken ct = default);
}
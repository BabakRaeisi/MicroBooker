using MicroBooker.Application;
using MicroBooker.Domain;
using MicroBooker.Infrastructure;
using StackExchange.Redis;
using MongoDB.Driver;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Bson;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var connStr = builder.Configuration.GetConnectionString("Redis")
                  ?? "localhost:6379";

    var config = ConfigurationOptions.Parse(connStr);
    config.AbortOnConnectFail = false;
    config.ConnectRetry = 3;
    config.ReconnectRetryPolicy = new ExponentialRetry(5000);

    return ConnectionMultiplexer.Connect(config);
});

builder.Services.AddSingleton<ILockService, RedisLockService>();
builder.Services.AddSingleton<IEventPublisher, KafkaEventPublisher>();

builder.Services.AddSingleton<IMongoClient>(_ =>
    new MongoClient(
        builder.Configuration.GetConnectionString("Mongo")
        ?? "mongodb://localhost:27017"));

builder.Services.AddSingleton(sp =>
    sp.GetRequiredService<IMongoClient>().GetDatabase("BookerDb"));

builder.Services.AddScoped<IReservationRepository, MongoReservationRepository>();
builder.Services.AddScoped<IRestaurantRepository, MongoRestaurantRepository>();
builder.Services.AddScoped<IRestaurantTableRepository, MongoRestaurantTableRepository>();

builder.Services.AddScoped<ReservationService>();
builder.Services.AddScoped<RestaurantService>();
builder.Services.AddScoped<RestaurantTableService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalClient", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:4200",
                "https://microbooker.babakraeisi.com")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

#pragma warning disable CS0618
BsonSerializer.RegisterSerializer(
    new GuidSerializer(GuidRepresentation.Standard));
#pragma warning restore CS0618

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    builder.Configuration["Jwt:Key"]!)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

builder.WebHost.UseUrls(
    Environment.GetEnvironmentVariable("ASPNETCORE_URLS")
    ?? "http://0.0.0.0:5147");

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

using (var scope = app.Services.CreateScope())
{
    var database =
        scope.ServiceProvider.GetRequiredService<IMongoDatabase>();

    var reservations =
        database.GetCollection<Reservation>("reservations");

    var reservationKeys =
        Builders<Reservation>.IndexKeys
            .Ascending(x => x.RestaurantId)
            .Ascending(x => x.TableId)
            .Ascending(x => x.TimeSlot);

    await reservations.Indexes.CreateOneAsync(
        new CreateIndexModel<Reservation>(
            reservationKeys,
            new CreateIndexOptions
            {
                Unique = true,
                Name = "ux_reservation_slot"
            }));

    var restaurants =
        database.GetCollection<Restaurant>("restaurants");

    await restaurants.Indexes.CreateOneAsync(
        new CreateIndexModel<Restaurant>(
            Builders<Restaurant>.IndexKeys.Ascending(x => x.Slug),
            new CreateIndexOptions
            {
                Unique = true,
                Name = "ux_restaurant_slug"
            }));

    var tables =
        database.GetCollection<RestaurantTable>("restaurantTables");

    var tableKeys =
        Builders<RestaurantTable>.IndexKeys
            .Ascending(x => x.RestaurantId)
            .Ascending(x => x.TableNumber);

    await tables.Indexes.CreateOneAsync(
        new CreateIndexModel<RestaurantTable>(
            tableKeys,
            new CreateIndexOptions
            {
                Unique = true,
                Name = "ux_restaurant_table_number"
            }));
}

app.UseCors("AllowLocalClient");

app.MapGet("/health", () => Results.Ok("Healthy"));
app.MapGet("/live", () => Results.Ok("ok"));

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedProto
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

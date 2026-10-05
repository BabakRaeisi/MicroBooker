using MicroBooker.Application;
using MicroBooker.Domain;
using ReservationDocument = MicroBooker.Domain.Reservation;
using MicroBooker.Infrastructure;
using StackExchange.Redis;
using MongoDB.Driver;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Bson;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "JWT Authorization header using the Bearer scheme."
        });

    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] = []
        });
});

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
        policy.SetIsOriginAllowed(origin =>
            {
                if (origin == "https://microbooker.babakraeisi.com")
                    return true;

                return Uri.TryCreate(
                           origin,
                           UriKind.Absolute,
                           out var uri) &&
                       (uri.Host == "localhost" ||
                        uri.Host == "127.0.0.1");
            })
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
        database.GetCollection<ReservationDocument>("reservations");

    var reservationKeys =
        Builders<ReservationDocument>.IndexKeys
            .Ascending(x => x.RestaurantId)
            .Ascending(x => x.TableId)
            .Ascending(x => x.TimeSlot);

    await reservations.Indexes.CreateOneAsync(
        new CreateIndexModel<ReservationDocument>(
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

    if (app.Environment.IsDevelopment())
    {
        var demoRestaurantId =
            Guid.Parse("3c59cb69-b280-464f-8f42-3f9866955fb8");

        var demoRestaurantExists = await restaurants
            .Find(x => x.Id == demoRestaurantId)
            .AnyAsync();

        if (!demoRestaurantExists)
        {
            await restaurants.InsertOneAsync(
                new Restaurant
                {
                    Id = demoRestaurantId,
                    Name = "Aspire Test Restaurant",
                    Slug = "aspire-test-restaurant-1",
                    Address = "100 Test Street",
                    Phone = "+14165551234",
                    OpeningTime = new TimeOnly(10, 0),
                    ClosingTime = new TimeOnly(23, 0),
                    OwnerUserId = "development-seed"
                });
        }

        var demoTableId =
            Guid.Parse("fa18b0ab-52cc-4e13-abb2-e5061e384eed");

        var demoTableExists = await tables
            .Find(x => x.Id == demoTableId)
            .AnyAsync();

        if (!demoTableExists)
        {
            await tables.InsertOneAsync(
                new RestaurantTable
                {
                    Id = demoTableId,
                    RestaurantId = demoRestaurantId,
                    TableNumber = 1,
                    Capacity = 4,
                    IsActive = true
                });
        }
    }
}

app.UseCors("AllowLocalClient");

app.MapDefaultEndpoints();

// Legacy alias kept for existing local/deployment checks.
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

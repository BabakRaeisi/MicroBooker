var builder = DistributedApplication.CreateBuilder(args);

var redis = builder.AddRedis("redis");

var mongo = builder.AddMongoDB("mongo");

var kafka = builder.AddKafka("kafka");

var reservationApi = builder
    .AddProject<Projects.Reservation_Api>("reservation-api")
    .WithReference(redis)
    .WithReference(mongo)
    .WithReference(kafka)
    .WaitFor(redis)
    .WaitFor(mongo)
    .WaitFor(kafka)
    .WithExternalHttpEndpoints();

builder
    .AddProject<Projects.MicroBooker_StorageWorker>("storage-worker")
    .WithReference(redis)
    .WithReference(mongo)
    .WithReference(kafka)
    .WaitFor(redis)
    .WaitFor(mongo)
    .WaitFor(kafka);

builder
    .AddViteApp("client", "../MicroBooker.Client")
    .WithReference(reservationApi)
    .WithEnvironment(
        "VITE_API_BASE_URL",
        reservationApi.GetEndpoint("http"))
    .WithEnvironment(
        "VITE_RESTAURANT_ID",
        "3c59cb69-b280-464f-8f42-3f9866955fb8")
    .WaitFor(reservationApi)
    .WithExternalHttpEndpoints();

builder.Build().Run();

var builder = DistributedApplication.CreateBuilder(args);

var redis = builder.AddRedis("Redis");

var mongo = builder.AddMongoDB("Mongo");

var kafka = builder.AddKafka("Kafka");

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
    .WaitFor(reservationApi)
    .WithExternalHttpEndpoints();

builder.Build().Run();

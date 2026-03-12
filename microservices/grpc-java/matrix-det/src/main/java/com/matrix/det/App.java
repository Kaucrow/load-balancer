package com.matrix.det;

import io.grpc.Server;
import io.grpc.ServerBuilder;

import java.io.IOException;

public class App {

    private static final int PORT = 50051;

    public static void main(String[] args) throws IOException, InterruptedException {
        Server server = ServerBuilder.forPort(PORT)
                .addService(new MatrixDeterminantServiceImpl())
                .build()
                .start();

        System.out.println("MatrixDeterminantService escuchando en puerto " + PORT);

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("Apagando servidor...");
            server.shutdown();
        }));

        server.awaitTermination();
    }
}
